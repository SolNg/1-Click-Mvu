# Bảng thuật ngữ đề xuất (bản nháp — cần bạn duyệt)

Đếm trên **610 chuỗi UI cần dịch**. Cột "Số lần" = số chuỗi UI có chứa từ đó.
Cột "Đề xuất" mới là gợi ý, **chưa chốt** — mục đích là thống nhất trước khi dịch để 16 component
không dùng 3 cách gọi khác nhau cho cùng một khái niệm.

| Số lần | Tiếng Trung | Đề xuất | Ghi chú |
|---:|---|---|---|
| 142 | 角色 | nhân vật | dùng chung cả "character" lẫn "role" |
| 109 | 生成 | tạo / sinh | thống nhất 1 trong 2, đừng lẫn lộn |
| 77 | 角色卡 | thẻ nhân vật | thuật ngữ SillyTavern (character card) |
| 27 | 人设 | hồ sơ nhân vật | phân biệt rõ với 角色卡 |
| 27 | 阶段 | giai đoạn | |
| 25 | 写卡器 | trình tạo thẻ | tên công cụ — cân nhắc giữ nguyên "Writer" |
| 23 | 世界书 | world book | **thuật ngữ SillyTavern, nên giữ nguyên tiếng Anh** |
| 23 | 恢复 | khôi phục | |
| 21 | 格式 | định dạng | |
| 19 | 检查 | kiểm tra | |
| 17 | 设置 | thiết lập | |
| 17 | 调色盘 | bảng màu tính cách | ẩn dụ cốt lõi của preset, giữ nguyên hình ảnh "bảng màu" |
| 16 | 素材 | tư liệu | input thô người dùng nhập |
| 16 | 重试 | thử lại | |
| 15 | 世界观 | thế giới quan | |
| 14 | 开场白 | lời mở đầu | SillyTavern gọi là "first message"/"greeting" |
| 13 | 状态栏 | thanh trạng thái | status bar MVU |
| 11 | 草稿 | bản nháp | |
| 8 | 二次解释 | diễn giải bổ sung | khái niệm riêng của preset |
| 6 | 多阶段 | nhiều giai đoạn | |
| 5 | 变量 | biến | biến MVU |
| 3 | 初识期 / 熟悉期 / 亲近期 | mới quen / thân quen / gần gũi | 3 mốc theo 好感度 (0–30 / 31–70 / 71–100) |
| 3 | 速览 | tóm tắt nhanh | |
| 3 | 条目 | mục | entry world book |
| 3 | 预设 | preset | thuật ngữ SillyTavern, nên giữ nguyên |
| 2 | 好感度 | thiện cảm | **chỉ dịch phần nhãn hiển thị — tên biến giữ nguyên (xem review §3.1)** |
| 2 | 封面 | ảnh bìa | |
| 1 | 蒸馏 | chưng cất / cô đọng | bước nén tư liệu dài trước khi gửi LLM |

## Thuật ngữ nên GIỮ NGUYÊN tiếng Anh

`SillyTavern`, `world book`, `preset`, `regex`, `script`, `MVU`, `EJS`, `YAML`, `token`, `prompt`.

Người dùng SillyTavern Việt Nam thường đã quen các từ này; dịch ra sẽ khó tra cứu hơn.

## Quy ước dấu câu

| Trung | Việt |
|---|---|
| `，` | `,` |
| `。` | `.` |
| `：` | `: ` |
| `（ ）` | `( )` |
| `、` | `, ` |
| `“ ”` | `" "` |
| `？` `！` | `?` `!` |
| `~` trong `0~30` | `–` hoặc `-` |

## Giọng văn

Bản gốc xưng hô với người dùng bằng `你` và dùng nhiều câu mệnh lệnh ngắn
(`请先完成写卡素材`, `不能为空`). Đề xuất giữ giọng trung tính, không dùng "bạn" quá dày:

- `角色卡名称不能为空` → "Tên thẻ nhân vật không được để trống." (không phải "Bạn chưa nhập tên…")
- `请先完成写卡素材` → "Cần hoàn tất tư liệu trước." 
- Toastr title (tham số thứ 2 của `toastr.*`) là **tiêu đề ngắn**, giữ ≤ 4 từ để không tràn.
