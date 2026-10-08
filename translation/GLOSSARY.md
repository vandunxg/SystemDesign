# Glossary — Practical System Design Vietnamese

Glossary là guideline để chọn từ nhanh và tự nhiên, không phải rule replace tuyệt đối.

- ưu tiên cách developer Việt Nam thực tế sử dụng;
- giữ English nếu bản dịch tiếng Việt gượng hoặc mất precision;
- dùng tiếng Việt nếu ngắn, rõ và quen thuộc;
- consistency theo concept và context;
- không đổi identifier, code, URL hoặc proper noun.

| Term | Cách dùng thường ưu tiên | Ghi chú |
| --- | --- | --- |
| user | người dùng | `user_id` trong code giữ nguyên |
| request | request / yêu cầu | Giữ `request` khi nói về object hoặc flow |
| response | response / phản hồi | |
| server | server / máy chủ | Chọn theo văn phong đoạn |
| database | database / cơ sở dữ liệu | |
| cache | cache | |
| load balancer | load balancer | Không bắt buộc “bộ cân bằng tải” |
| throughput | throughput / thông lượng | |
| latency | latency / độ trễ | |
| availability | availability / tính sẵn sàng | |
| consistency | consistency / tính nhất quán | |
| scalability | scalability / khả năng mở rộng | |
| partition / shard | partition / shard | Theo context hệ thống |
| replication | replication / nhân bản | |
| queue | queue / hàng đợi | |
| message | message / thông điệp | |
| stream | stream / luồng dữ liệu | |
| storage | storage / lưu trữ | |
| metadata | metadata / siêu dữ liệu | |
| schema | schema / lược đồ | |
| transaction | transaction / giao dịch | |
| retry | retry / thử lại | |
| failover | failover / chuyển đổi dự phòng | |
| upstream / downstream | upstream / downstream | |
| async | async / bất đồng bộ | |
| synchronous | synchronous / đồng bộ | |

Nếu term không có trong bảng, tự chọn cách diễn đạt tốt nhất theo `RULE.md`; không cần proposal hay report.
