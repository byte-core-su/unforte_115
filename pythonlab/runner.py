"""Shared browser / local verification runner. Executes each case in fresh globals."""
import ast
import builtins
import contextlib
import io
import json
import math
import traceback


class _LabOutput(io.StringIO):
    def write(self, value):
        if self.tell() + len(value) > 20000:
            raise RuntimeError("輸出超過 20,000 字，請檢查迴圈或縮小資料範圍。")
        return super().write(value)


def _lab_run(code, input_text="", probe=""):
    output = _LabOutput()
    lines = iter(input_text.replace("\r\n", "\n").split("\n") if input_text else [])

    def read_input(prompt=""):
        if prompt:
            output.write(str(prompt))
        try:
            return next(lines)
        except StopIteration:
            raise EOFError("輸入資料不足：每次 input() 需要一行，請補齊資料或檢查停止條件。") from None

    local_builtins = dict(vars(builtins))
    local_builtins["input"] = read_input
    namespace = {"__name__": "__main__", "__builtins__": local_builtins}
    error = None
    with contextlib.redirect_stdout(output), contextlib.redirect_stderr(output):
        try:
            exec(compile(code, "student.py", "exec"), namespace)
            if probe:
                exec(compile(probe, "test.py", "exec"), namespace)
        except BaseException as exc:
            frames = traceback.extract_tb(exc.__traceback__)
            student_frames = [frame for frame in frames if frame.filename == "student.py"]
            line = getattr(exc, "lineno", None) or (student_frames[-1].lineno if student_frames else None)
            error = {"type": type(exc).__name__, "message": str(exc)[:1500], "line": line}
    return {"output": output.getvalue(), "error": error}


def _lab_normalize(text):
    return "\n".join(line.rstrip() for line in text.replace("\r\n", "\n").splitlines()).strip()


def _lab_matches(actual, case):
    actual = _lab_normalize(actual)
    expected = _lab_normalize(case["expected"])
    if not case.get("numeric"):
        return actual == expected
    a = actual.splitlines()
    b = expected.splitlines()
    if len(a) != len(b):
        return False
    for x, y in zip(a, b):
        try:
            target = float(y)
        except ValueError:
            if x != y:
                return False
            continue
        try:
            value = float(x)
        except ValueError:
            return False
        if not math.isfinite(value) or not math.isfinite(target) or not math.isclose(value, target, rel_tol=1e-7, abs_tol=1e-7):
            return False
    return True


def _lab_dispatch(request_json):
    request = json.loads(request_json)
    code = request["code"]
    if request["action"] == "run":
        return json.dumps(_lab_run(code, request.get("input", "")), ensure_ascii=False)
    results = []
    try:
        tree = ast.parse(code)
        nodes = [type(node).__name__ for node in ast.walk(tree)]
        nested_for = any(isinstance(node, ast.For) and any(isinstance(child, ast.For) for statement in node.body for child in ast.walk(statement)) for node in ast.walk(tree))
    except SyntaxError:
        nodes = []
        nested_for = False
    for case in request.get("tests", []):
        result = _lab_run(code, case.get("input", ""), case.get("probe", ""))
        missing = [name for name in case.get("requires", []) if name not in nodes]
        if case.get("nestedFor") and not nested_for:
            missing.append("巢狀 for 迴圈")
        if case.get("printKeyword"):
            if not nodes or not any(isinstance(node, ast.Call) and isinstance(node.func, ast.Name) and node.func.id == "print" and any(keyword.arg == case["printKeyword"] for keyword in node.keywords) for node in ast.walk(tree)):
                missing.append("print 的 " + case["printKeyword"] + " 參數")
        result.update({"name": case["name"], "input": case.get("input", ""), "expected": case["expected"], "missing": missing})
        result["passed"] = not result["error"] and not missing and _lab_matches(result["output"], case)
        results.append(result)
    return json.dumps({"results": results}, ensure_ascii=False)
