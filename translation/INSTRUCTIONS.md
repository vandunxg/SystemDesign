# Translation Instructions

Mỗi agent chỉ cần đọc:

1. `translation/RULE.md`
2. File Markdown nguồn được giao

Sau đó dịch **nguyên file** sang target `vi/...` tương ứng, đọc lại nhanh một lượt rồi kết thúc.

Không cần đọc thêm file glossary, report, state, audit hoặc review prompt trừ khi task cụ thể yêu cầu.

Không chạy formatter/check script cho từng file mặc định. Validation được thực hiện theo batch sau khi các worker hoàn thành.
