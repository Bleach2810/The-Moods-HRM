const fs = require('fs');
const files = [
  'c:/Users/Dell/Desktop/tm/src/app/admin/page.tsx',
  'c:/Users/Dell/Desktop/tm/src/app/(admin)/admin-site/admin/page.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  if (!content.includes('Giới hạn phạt tối đa (VNĐ):')) {
     const target = 'placeholder="Ví dụ: 2"\r\n                      className="input w-full text-xs font-semibold"\r\n                      required\r\n                    />\r\n                  </div>';
     const replace = target + '\r\n                  <div className="space-y-1">\r\n                    <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Giới hạn phạt tối đa (VNĐ):</label>\r\n                    <input\r\n                      type="number"\r\n                      value={latePenaltyMaxAmount}\r\n                      onChange={e => setLatePenaltyMaxAmount(e.target.value)}\r\n                      placeholder="Ví dụ: 500000"\r\n                      className="input w-full text-xs font-semibold"\r\n                    />\r\n                  </div>';
     content = content.replace(target, replace);
     
     // Note: if the above doesn't match because of \r\n, use a more flexible replacement
     const idx = content.indexOf('<label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Hệ số nhân');
     if (idx !== -1) {
       const endDiv = content.indexOf('</div>', idx);
       if (endDiv !== -1 && !content.includes('Giới hạn phạt tối đa')) {
         const insert = '\n                <div className="space-y-1">\n                  <label className="text-[10px] font-black uppercase text-[#7c4831] tracking-wider block">Giới hạn phạt tối đa (VNĐ):</label>\n                  <input\n                    type="number"\n                    value={latePenaltyMaxAmount}\n                    onChange={e => setLatePenaltyMaxAmount(e.target.value)}\n                    placeholder="Ví dụ: 500000"\n                    className="input w-full text-xs font-semibold"\n                  />\n                </div>';
         content = content.slice(0, endDiv + 6) + insert + content.slice(endDiv + 6);
       }
     }
  }

  if (!content.includes('không vượt quá {(Number(latePenaltyMaxAmount)')) {
     const idx2 = content.indexOf('(hệ số lũy tiến hình học).</div>');
     if (idx2 !== -1) {
        const insert2 = '\n                  <div>Phạt đi trễ cho một ca làm việc sẽ <strong>không vượt quá {(Number(latePenaltyMaxAmount) || 500000).toLocaleString("vi-VN")} VNĐ</strong>.</div>';
        content = content.slice(0, idx2 + 32) + insert2 + content.slice(idx2 + 32);
     }
  }
  
  if (!content.includes('Giới hạn tối đa:</span>')) {
     const target3 = 'x{latePenaltyMultiplier} (mỗi {latePenaltyIntervalMinutes}m)</span></div>';
     const idx3 = content.indexOf(target3);
     if (idx3 !== -1) {
        const insert3 = '\n                <div className="flex justify-between items-center"><span className="text-[#4B3621]/60 uppercase tracking-wider">Giới hạn tối đa:</span><span className="text-sm text-[#4B3621]">{(Number(latePenaltyMaxAmount) || 500000).toLocaleString("vi-VN")}đ</span></div>';
        content = content.slice(0, idx3 + target3.length) + insert3 + content.slice(idx3 + target3.length);
     }
  }

  fs.writeFileSync(file, content);
});
console.log('Patched via Node');
