// Suggestions guide the workflow; students may still run or verify in any order.
export function operationStep({ stage, activity, code, input, execution, verification, completed, ready, busy, runtimeState, lastAction, isLastUnit = false }) {
  const tier = activity.tier || 0;
  const tested = verification?.code === code ? verification : null;
  const ran = execution?.code === code && execution.input === input ? execution : null;
  const passed = tested ? tested.ok : tier && completed?.levels?.[tier]?.code === code;
  const next = { action: 'next', label: stage === 0 ? '前往引導練習 →' : stage === 1 ? '挑戰初階一星 →' : tier === 1 ? '繼續挑戰二星 →' : tier === 2 ? '選做三星挑戰 →' : isLastUnit ? '返回課程總覽 →' : '前往下一單元 →' };
  const step = (title, text, action, label, secondary = null) => ({ title, text, action, label, secondary, disabled: false });
  if (busy) return { ...step('程式執行中，請稍候', '若一直沒有結束，可按「停止」並檢查迴圈條件。', 'stop', '停止本次執行'), busy: true };
  if (ran && !ran.ok && lastAction === 'run') return step('先修正執行錯誤', '查看錯誤行號和修正提示。若輸入不足，在「輸入資料」補齊各行，再重新執行。', 'feedback', '查看錯誤提示', { action: 'helper', label: '查參考小幫手' });
  if (passed) return tier
    ? step(`本題 ${'★'.repeat(tier)} 驗證已通過`, '可填寫班級、座號、姓名，顯示通關證書並擷圖。領證後仍能繼續挑戰；三星為選做。', 'certificate', '領取／查看通關證書', next)
    : step('引導練習驗證通過', '現在試試初階任務。通過初階驗證才會取得第一顆星。', 'next', next.label);
  if (tested && !tested.ok) return step('先看第一個失敗案例', '比較「預期輸出」和「你的輸出」，一次修正一個地方，再按「驗證任務」。部分通過還不能取得星星。', 'feedback', '查看失敗原因', { action: 'edit', label: '回到程式修改' });
  if (ran && !ran.ok) return step('先修正執行錯誤', '查看錯誤行號和修正提示。若輸入不足，在「輸入資料」補齊各行，再重新執行。', 'feedback', '查看錯誤提示', { action: 'helper', label: '查參考小幫手' });
  if (ran?.ok && !tier && stage === 0) return step('看看執行結果，再改一處試試', '這次只是試跑，還沒有取得星星。可以改一句文字再執行，觀察差異；看懂後前往引導練習。', 'output', '查看執行結果', next);
  if (ran?.ok) return step(tier ? '試跑成功，接著驗證通關' : '接著驗證你的修改', '先看看輸出是否符合任務，再按「驗證任務」用本站多組資料檢查；不使用你填的輸入資料。全部通過才算完成這題。', 'check', '✓ 驗證任務', { action: 'output', label: '查看試跑結果' });
  if (runtimeState === 'error') return step('Python 還沒準備好', '請確認網路後重新載入。程式草稿仍保留，也可以先閱讀任務或查語法。', 'retry', '重新載入 Python', { action: 'helper', label: '查參考小幫手' });
  const needsInput = /\binput\s*\(/.test(activity.solution || '');
  if (!ready) return step('先看任務，Python 正在準備', '載入期間可先閱讀、預測或修改已有程式。準備完成後，「執行程式」會開放。', 'edit', '查看起始程式');
  if (needsInput && input === '') return step('先準備輸入資料', '這題會使用 input()，每次需要一行資料。可載入原本的範例，再修改回答；不用在執行結果裡打字。', 'input', '到輸入區填資料', { action: 'load-input', label: '載入範例輸入' });
  if (stage === 0) return step('先執行這份示範程式', `程式已準備好，不必從空白開始。${needsInput ? '輸入資料也已填好，每一行對應一次 input()。' : '這題不需要輸入資料。'}先觀察結果，再改一處看看。`, 'run', '▶ 執行示範程式', needsInput ? { action: 'input', label: '查看輸入資料' } : { action: 'predict', label: '先寫我的預測（可選）' });
  return step(stage === 1 ? '依任務補上或修改程式' : `挑戰${['', '初階一星', '進階二星', '終極三星'][tier]}`, `${tier >= 2 ? '請修改新規則，前一關的完整解答還不能直接通關。' : '先讀任務，再修改程式區已有的範例。'}${needsInput ? '試跑時先確認下方輸入資料。' : '這題不需要輸入資料。'}先按「執行程式」觀察，完成後按「驗證任務」。`, 'edit', '到程式區修改', { action: 'hints', label: tier === 1 ? '看提示／初階參考解答' : '查看本題提示' });
}
