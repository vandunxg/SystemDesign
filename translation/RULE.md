# SystemDesign Vietnamese Translation Rule

Mục tiêu: **dịch nhanh, đúng meaning, đọc tự nhiên như tài liệu system design do developer Việt viết**.

## 1. Một agent = một file tài liệu

Mỗi agent nhận đúng một file Markdown nguồn và chịu trách nhiệm toàn bộ file target `vi/...` tương ứng.

Không chia một tài liệu thành task riêng cho heading, paragraph, image, example hay reference.

Một file được xem là hoàn thành end-to-end khi toàn bộ prose, heading, danh sách, bảng, chú thích hình và reference trong file đó đã được xử lý.

## 2. Cách dịch

- Dịch meaning, không dịch word-by-word.
- Không thêm ý, không tóm tắt, không tự sửa kiến trúc, số liệu, trade-off hoặc kết luận kỹ thuật.
- Câu tiếng Việt ngắn gọn, tự nhiên, phù hợp văn phong technical documentation.
- Giữ English technical/domain term nếu developer dùng tự nhiên hơn: `load balancer`, `cache`, `database`, `request`, `response`, `throughput`, `latency`, `availability`, `sharding`, `replication`, `leader`, `follower`, `upstream`, `downstream`, v.v.
- Không cố Việt hóa term chỉ để câu “thuần Việt”.
- Với từ phổ thông có bản Việt tự nhiên thì dùng tiếng Việt: `user → người dùng`, `request → request/yêu cầu` tùy ngữ cảnh, `storage → lưu trữ`, `database → database/cơ sở dữ liệu` tùy câu.
- Giữ nhất quán một term trong cùng tài liệu, nhưng ưu tiên meaning và độ tự nhiên hơn bảng thay thế cứng.

Style tham chiếu:

> System chủ yếu phục vụ người dùng cần tra cứu và cập nhật dữ liệu. Request đi qua load balancer rồi được phân phối đến các application server. Các server dùng cache cho read path phổ biến, còn write path ghi vào database và phát message để downstream xử lý các task async.

## 3. Phần giữ nguyên

Không sửa nội dung hoặc ý nghĩa của:

- code fence, code block, command và output mẫu;
- identifier, tên class, method, field và inline code;
- LaTeX/math và numeric literal;
- URL, domain, email và reference link destination;
- tên sản phẩm, công ty, giao thức và proper noun chính thức;
- tên file hình và phần đuôi của asset;
- HTML tag, HTML attribute và cấu trúc bảng/list;
- heading level và thứ tự section.

H1 và heading prose được phép dịch sang tiếng Việt, nhưng phải giữ số chương, tên riêng và technical term cần thiết.

Chú thích hình và alt text được dịch nếu là prose; path hình vẫn giữ nguyên về mặt asset và chỉ điều chỉnh prefix tương đối khi cần để target `vi/` render đúng.

## 4. Nhãn cấu trúc

Dịch meaning của nhãn nhưng giữ nguyên cấp heading:

- `Introduction → Giới thiệu`
- `Requirements → Yêu cầu`
- `Functional requirements → Yêu cầu chức năng`
- `Non-functional requirements → Yêu cầu phi chức năng`
- `Capacity estimation → Ước tính dung lượng`
- `Back-of-the-envelope estimation → Ước tính sơ bộ`
- `High-level design → Thiết kế cấp cao`
- `Detailed design → Thiết kế chi tiết`
- `Data model → Mô hình dữ liệu`
- `API design → Thiết kế API`
- `Summary → Tóm tắt`
- `References → Tài liệu tham khảo`

Nếu source dùng heading tiếng Trung hoặc tiếng Anh khác, dịch theo meaning và giữ cấu trúc, không ép về một mẫu máy móc.

## 5. Workflow

Mỗi agent chỉ làm 3 việc:

1. Đọc toàn bộ file Markdown nguồn được giao.
2. Dịch toàn bộ file sang target `vi/...` tương ứng.
3. Đọc lại target một lượt để bắt lỗi rõ ràng rồi kết thúc.

Không chạy formatter/check script cho từng worker trừ khi task cụ thể yêu cầu hoặc có lỗi nghi ngờ.

Validation tự động và review liên file chạy theo batch/CI, không phải trách nhiệm mặc định của từng agent.

## 6. Dịch song song

- Có thể khởi chạy nhiều agent cùng lúc cho các file độc lập.
- Mỗi agent chỉ được ghi đúng một target file; không có hai agent cùng ghi một file.
- Coordinator phải lập danh sách source-target trước khi dispatch và bảo đảm ownership không chồng lấn.
- Không chia một file cho nhiều agent. Một agent phải hoàn thành file đó end-to-end.
- `README.md` và `SUMMARY.md` cũng là một file độc lập khi được giao; không tự sửa chúng trong lúc dịch chapter khác.
- Sau khi tất cả worker kết thúc, coordinator chạy batch validation và xử lý các lỗi liên file nếu có.

Nếu dùng 20 agents thì mặc định là **20 file tài liệu khác nhau chạy song song**.

## 7. Không làm

Không tạo mặc định:

- report riêng cho từng file;
- hash, state hoặc coverage metadata;
- reviewer ceremony cho từng worker;
- glossary proposal cho một term đơn lẻ;
- subtask chỉ để dịch một đoạn, hình hoặc comment trong file.

Không sửa source Markdown, ảnh, hoặc tài liệu ngoài ownership được giao.
