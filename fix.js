const fs = require('fs');

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix Table classes
  content = content.replace(/<table className="w-full (.*?)text-left text-xs border-collapse">/g, '<table className="w-full min-w-max whitespace-nowrap [&_th]:whitespace-nowrap [&_td]:whitespace-nowrap text-left text-xs border-collapse">');
  
  // Fix UI bug in admin/page.tsx (Đơn Đã Xử Lý avatar issue)
  const uiBugFind = '<div className={w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-[9px] border }>\n                      <p className="text-[#7c4831]/70 font-semibold mt-0.5">{r.date} — {r.details}</p>\n                    </div>';
  const uiBugReplace = '<div className={w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-[9px] border }>\n                      {getInitials(r.staffName)}\n                    </div>\n                    <div>\n                      <p className="font-extrabold uppercase text-[#4B3621] tracking-tight">{r.staffName}</p>\n                      <p className="text-[#7c4831]/70 font-semibold mt-0.5">{r.date} — {r.details}</p>\n                    </div>';
  
  if (content.includes('getInitials(r.staffName)') === false || filePath.includes('admin/page.tsx')) {
    content = content.replace(uiBugFind, uiBugReplace);
  }

  // Also replace any specific p-4 without whitespace-nowrap just in case the above [th] doesn't work well
  // content = content.replace(/className="p-4"/g, 'className="p-4 whitespace-nowrap"');
  // content = content.replace(/className="p-4 /g, 'className="p-4 whitespace-nowrap ');

  fs.writeFileSync(filePath, content, 'utf8');
}

fixFile('src/app/admin/page.tsx');
fixFile('src/app/(admin)/admin-site/admin/page.tsx');
console.log('Fixed tables and UI without encoding issues!');
