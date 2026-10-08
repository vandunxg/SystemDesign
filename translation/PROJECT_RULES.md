# Project Rules — SystemDesign Vietnamese Mirror

## Scope và mapping

Source:

- `README.md`
- `SUMMARY.md`
- `CHAPTER *.md`
- `Volume2/CHAPTER *.md`

Target:

- `vi/README.md`
- `vi/SUMMARY.md`
- `vi/CHAPTER *.md`
- `vi/Volume2/CHAPTER *.md`

Giữ nguyên cấu trúc đường dẫn tương đối giữa source và target. Không sửa source, `images/`, hoặc các file ngoài target được giao.

## H1 và cấu trúc

- Giữ đúng cấp heading, thứ tự section, danh sách, bảng và code block.
- H1 được dịch sang tiếng Việt nhưng phải giữ số chương và proper noun chính thức.
- Tên sản phẩm/protocol như YouTube, Google Drive, HTTP, DNS, Redis và Kafka giữ nguyên.

## Protected content

Giữ nguyên:

- code, command, output mẫu và inline code;
- LaTeX, số liệu, đơn vị và identifier;
- URL, domain, email và destination của reference link;
- tên file hình, asset path và HTML structure.

Alt text/caption là prose và được dịch; asset path chỉ đổi prefix tương đối nếu target mirror cần để render đúng.

## Link policy

- External URL giữ nguyên tuyệt đối.
- Link đến tài liệu trong repo phải trỏ đến tài liệu tương ứng trong `vi/` khi target được tạo.
- Không tự đổi destination hoặc tạo link đến file chưa tồn tại.
- Link trong `README.md`/`SUMMARY.md` phải được kiểm tra lại sau batch để bảo đảm trỏ đúng bản dịch.

## Ownership và Git

- Một agent sở hữu một source file và một target file tương ứng.
- Nhiều agent được chạy song song khi ownership không chồng lấn.
- Worker chỉ ghi target được giao.
- Coordinator chịu trách nhiệm batch validation và các thay đổi index liên file.
- Không commit, push hoặc deploy nếu user chưa yêu cầu rõ ràng.
