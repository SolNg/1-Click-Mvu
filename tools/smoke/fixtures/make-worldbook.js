// Sinh world book gia lap co dung hinh dang cua mot lorebook boi canh that:
// ~94 muc, moi muc mot ten sach se va rat nhieu tu khoa kich hoat (~670 tu khoa tong cong).
// Dung de kiem tra: goi y ten nhan vat phai bam theo SO MUC chu khong theo SO TU KHOA.
const fs = require("fs");
const path = require("path");

const DISTRICTS = [
  "Quận 1", "Quận 3", "Quận 4", "Quận 5", "Quận 6", "Quận 7", "Quận 8", "Quận 10", "Quận 11", "Quận 12",
  "Quận Bình Thạnh", "Quận Gò Vấp", "Quận Phú Nhuận", "Quận Tân Bình", "Quận Tân Phú", "Quận Bình Tân",
  "Thành phố Thủ Đức", "Huyện Củ Chi", "Huyện Hóc Môn", "Huyện Bình Chánh", "Huyện Nhà Bè", "Huyện Cần Giờ",
];
const GROUPS = {
  "Địa điểm": ["Khách sạn", "Phòng gym", "Karaoke", "Quán bar hộp đêm", "Rạp chiếu phim", "Trung tâm thương mại",
    "Bến xe miền Đông", "Ga Sài Gòn", "Công viên nước", "Sân vận động", "Thư viện thành phố", "Bệnh viện Chợ Rẫy"],
  "Ẩm thực": ["Cơm tấm", "Bún bò", "Hủ tiếu gõ", "Bánh mì vỉa hè", "Ốc và đồ nướng", "Lẩu đêm",
    "Chè và món ngọt", "Cà phê sữa đá", "Trà sữa", "Cơm văn phòng"],
  "Văn hóa nhóm": ["Game/Esports", "2D và cosplay", "Billard của giới trẻ", "Nhạc indie", "Chạy bộ buổi sáng",
    "Cầu lông sân cỏ", "Nhiếp ảnh đường phố", "Xe cà phê rong"],
  "Đời sống": ["Giá nhà", "Thuê chỗ ở", "Ở ghép", "Chi phí sinh hoạt", "Đi làm bằng xe máy", "Học phí đại học"],
  "Mạng xã hội": ["Tiktok", "Facebook nhóm kín", "Threads", "Livestream bán hàng"],
};
const LOOSE = ["Tiếng lóng", "Văn hóa hẻm", "Mạng lưới giao thông", "Thời tiết hai mùa", "Văn hóa giới trẻ",
  "Nhịp sống ban đêm", "Ngập nước mùa mưa", "Chợ truyền thống"];

const SUFFIX = ["Chợ", "Công viên", "Nhà thờ", "Bến xe", "Cầu", "Đường", "Khu phố", "Quán cà phê", "Nhà nghỉ", "Siêu thị"];

function entry(name, keys) {
  return {
    name,
    content: "",
    enabled: true,
    strategy: { type: keys.length ? "selective" : "constant", keys, keys_secondary: { logic: "and_any", keys: [] } },
    extra: {},
  };
}

const out = [];
for (const d of DISTRICTS) {
  const short = d.replace(/^(Quận|Huyện|Thành phố)\s+/u, "");
  const keys = [d, short];
  for (const s of SUFFIX) keys.push(`${s} ${short}`);
  out.push(entry(d, keys));
}
for (const [group, names] of Object.entries(GROUPS))
  for (const n of names) out.push(entry(`[${group}] ${n}`, [n.toLowerCase(), n, `${n} Sài Gòn`, `${n} giá rẻ`]));
for (const n of LOOSE) out.push(entry(n, []));

const file = path.join(__dirname, "worldbook-demo.js");
fs.writeFileSync(
  file,
  "// SINH TU DONG boi tools/smoke/fixtures/make-worldbook.js — dung sua tay.\n" +
    "// World book gia lap theo dung hinh dang mot lorebook boi canh that.\n" +
    "window.__WORLDBOOK_DEMO = " + JSON.stringify(out, null, 1) + ";\n",
);
const keyCount = out.reduce((n, e) => n + e.strategy.keys.length, 0);
console.log(`worldbook-demo.js: ${out.length} muc, ${keyCount} tu khoa, ${fs.statSync(file).size} byte`);
