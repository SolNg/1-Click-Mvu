// Dung i18n/preset.vi.json tu cac file i18n/preset/pN.txt + bang ten prompt.
const fs = require("fs");
const NAMES = {
  main: "📋 Lời tác giả",
  1: "🐍 Xà nương chống đánh dấu (chống 429)",
  2: "🔓 Catbox phá giới hạn",
  3: "⚙️  Khởi tạo biến",
  4: "🐍 Thân phận Thu Thanh Tử",
  5: "📖 Tư duy sáng tác",
  6: "📐 Nguyên tắc sáng tác - độ không tuyệt đối",
  7: "📝 Yêu cầu định dạng kết quả",
  8: "【worldinfo】",
  worldInfoBefore: "World Info (before) - trước định nghĩa nhân vật",
  charDescription: "Char Description - mô tả nhân vật",
  personaDescription: "Persona Description - mô tả người chơi",
  charPersonality: "Char Personality - tính cách nhân vật",
  scenario: "Scenario - tình huống",
  worldInfoAfter: "World Info (after) - sau định nghĩa nhân vật",
  dialogueExamples: "Chat Examples - đối thoại mẫu",
  9: "Bắt đầu lịch sử trò chuyện",
  chatHistory: "Chat History - lịch sử trò chuyện",
  10: "Kết thúc lịch sử trò chuyện",
  11: "【/worldinfo】",
  12: "【Mục thường】",
  13: "📋 Thế giới quan",
  14: "📋 Thông tin cơ bản nhân vật",
  15: "📋 Bảng màu tính cách",
  16: "📋 Ba mặt tính cách",
  17: "📋 Diễn giải bổ sung",
  18: "📋 Tủ đồ",
  19: "📋 Bảng màu NSFW",
  20: "📋 Thẻ NSFW nhanh",
  21: "📋 Thiết kế NPC",
  22: "📋 Tóm tắt nhanh nhân vật",
  23: "📋 Trợ lý sáng tác tự do",
  24: "📋 Lời mở đầu",
  25: "📋 Làm đẹp giao diện",
  26: "📋 Đánh giá world book",
  27: "【/Mục thường】",
  28: "【Mục MVU】",
  29: "📋 Script cấu trúc biến MVU",
  30: "📋 Biến khởi tạo MVU",
  31: "📋 Luật cập nhật biến MVU",
  32: "📋 Danh sách biến MVU",
  33: "📋 Định dạng xuất biến MVU",
  34: "📋 Nhấn mạnh định dạng xuất biến MVU",
  35: "📋 Thanh trạng thái giao diện MVU",
  36: "📋 EJS",
  37: "📋 Hồ sơ nhiều giai đoạn bảng màu EJS",
  38: "📋 Bảng màu nhiều giai đoạn",
  39: "📋 Quy tắc thẻ",
  40: "【/Mục MVU】",
  41: "💭 Thu Thanh Tử bắt đầu nghĩ",
  42: "💭 Thu Thanh Tử đang nghĩ",
  43: "💭 Thu Thanh Tử nghĩ xong",
  44: " Định dạng kết quả",
  45: "🔓 Tiếp tục - Kemini",
  46: "🌕 1",
  47: "🌕 2",
  48: "🐍 Thu Thanh Tử đã nuốt chuỗi suy nghĩ gốc",
  49: "Cấu hình SPreset",
};
// Cac prompt thuc su duoc gui hoac doc lam knowledge -> dich ca noi dung
const CONTENT_IDS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "13", "24", "39", "46", "47"];

const out = {};
for (const [id, name] of Object.entries(NAMES)) out[id] = { name };
for (const id of CONTENT_IDS) {
  const f = `i18n/preset/p${id}.txt`;
  if (!fs.existsSync(f)) throw new Error("Thieu ban dich: " + f);
  out[id].content = fs.readFileSync(f, "utf8").replace(/\n$/, "");
}
fs.writeFileSync("i18n/preset.vi.json", JSON.stringify(out, null, 1));
console.log(`preset.vi.json: ${Object.keys(out).length} ten, ${CONTENT_IDS.length} noi dung`);
