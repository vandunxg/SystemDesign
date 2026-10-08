# Chương 02: Ước tính sơ bộ



Trong các buổi phỏng vấn system design, đôi khi bạn được yêu cầu dùng phương pháp ước tính sơ bộ để ước tính nhu cầu về capacity hoặc hiệu năng của hệ thống. Theo Jeff Dean, nghiên cứu viên cấp cao của Google, “ước tính sơ bộ là việc kết hợp một loạt thí nghiệm tư duy với các số liệu hiệu năng phổ biến để có được hiểu biết tương đối rõ về thiết kế nào có thể đáp ứng yêu cầu của bạn” \[1].

Để thực hiện ước tính sơ bộ hiệu quả, bạn cần nắm vững kiến thức nền tảng về khả năng mở rộng. Các khái niệm sau cần được hiểu sâu: lũy thừa của 2 \[2], các số liệu về độ trễ mà mọi lập trình viên nên biết và các số liệu về availability.

### Lũy thừa của 2

Mặc dù khi làm việc với hệ thống phân tán, lượng dữ liệu có thể trở nên cực kỳ lớn, mọi phép tính đều quy về những kiến thức nền tảng. Để tính toán chính xác, việc hiểu các đơn vị dữ liệu dựa trên lũy thừa của 2 là rất quan trọng. Một byte là một chuỗi gồm 8 bit. Một ký tự ASCII sử dụng một byte bộ nhớ (8 bit). Dưới đây là bảng giải thích các đơn vị dữ liệu (Bảng 2-1).

![](images/chapter2/table2-1.png)

### Các số liệu về độ trễ mà mọi lập trình viên nên biết

Tiến sĩ Dean của Google đã công bố thời gian của các phép toán máy tính điển hình vào năm 2010\[1]. Khi máy tính trở nên nhanh và mạnh hơn, một số con số đã lỗi thời. Tuy nhiên, các con số này vẫn giúp chúng ta hình dung tốc độ và độ chậm của những phép toán máy tính khác nhau.

![](images/chapter2/table2-2.png)

### Lưu ý

ns = nanosecond, μs = microsecond, ms = millisecond

$$1 \space ns = 10^{-9} \space s$$

$$1 \space \mu s= 10^{-6} \space s = 1,000 \space ns$$

$$1 \space ms = 10^{-3} \space s = 1,000 \space \mu s = 1,000,000 \space ns$$

Một kỹ sư phần mềm của Google đã xây dựng một công cụ để trực quan hóa dữ liệu của tiến sĩ Dean. Công cụ này cũng tính đến yếu tố thời gian. Hình 2-1 hiển thị các số liệu về độ trễ được trực quan hóa tính đến năm 2020 (nguồn hình: tài liệu tham khảo \[3]).

![figure2-1.png](images/chapter2/figure2-1.png)

Phân tích các con số trong Hình 2-1, chúng ta rút ra những kết luận sau:

* Bộ nhớ nhanh, nhưng ổ đĩa chậm.
* Nếu có thể, nên tránh seek trên ổ đĩa.
* Các thuật toán nén đơn giản có tốc độ nhanh.
* Nén dữ liệu nhiều nhất có thể trước khi gửi dữ liệu lên internet.
* Các data center thường nằm ở những region khác nhau, nên việc gửi dữ liệu giữa chúng cần một khoảng thời gian nhất định.

### Số liệu về availability

Availability cao là khả năng hệ thống liên tục hoạt động và duy trì vận hành trong thời gian dài. Availability thường được biểu thị dưới dạng phần trăm; 100% có nghĩa là dịch vụ không có bất kỳ downtime nào. Availability của hầu hết dịch vụ nằm trong khoảng từ 99% đến 100%.

Service-level agreement (SLA) là thuật ngữ thường được các nhà cung cấp dịch vụ sử dụng. Đây là thỏa thuận giữa bạn (nhà cung cấp dịch vụ) và khách hàng, chính thức định nghĩa mức uptime mà dịch vụ của bạn sẽ cung cấp. Các nhà cung cấp cloud Amazon, Google và Microsoft đặt SLA của họ ở mức 99.9% hoặc cao hơn. Uptime của hệ thống theo truyền thống được đo bằng số 9. Càng nhiều số 9 thì uptime của hệ thống càng cao. Như minh họa trong Bảng 2-3, số lượng số 9 tương ứng với downtime dự kiến của hệ thống.

![img.png](images/chapter2/table2-3.png)

### Ví dụ: Ước tính query volume và nhu cầu lưu trữ của Twitter

Lưu ý rằng các con số dưới đây chỉ được dùng cho bài tập này, không phải dữ liệu thực tế của Twitter.

Giả định:

* Có 300 triệu người dùng hoạt động hàng tháng.
* 50% người dùng sử dụng Twitter mỗi ngày.
* Trung bình mỗi người dùng đăng 2 tweet mỗi ngày.
* 10% tweet chứa media.
* Dữ liệu được lưu trữ trong 5 năm.

Ước tính: Ước tính số query mỗi giây (QPS):

* Người dùng hoạt động hàng ngày (DAU) = 300 triệu \* 50% = 150 triệu
* Tweet QPS = 150 triệu \* 2 tweet / 24 giờ / 3600 giây = khoảng 3500
* QPS cao điểm = 2 \* QPS = khoảng 7000

(Ghi chú của người dịch: Nói chính xác hơn, ở đây nên ước tính TPS thay vì QPS. Đây chỉ là quan điểm cá nhân; bản dịch vẫn giữ QPS theo ý tác giả gốc.)

Ở đây chúng ta chỉ ước tính phần lưu trữ media.

* Kích thước tweet trung bình:
  * ID tweet 64 bytes (byte)
  * Văn bản 140 bytes (byte)
  * Media 1MB
* Lưu trữ media: 150 triệu \* 2 \* 10% \* 1MB = 30TB mỗi ngày
* Lưu trữ media trong 5 năm: 30TB \* 365 \* 5 = khoảng 55PB

### Mẹo nhỏ

Ước tính sơ bộ chú trọng quá trình hơn kết quả. Giải quyết được bài toán quan trọng hơn việc có được kết quả chính xác. Người phỏng vấn có thể đánh giá khả năng giải quyết vấn đề của bạn. Dưới đây là một số gợi ý:

* Làm tròn và dùng giá trị xấp xỉ. Thực hiện các phép tính phức tạp trong buổi phỏng vấn là rất khó. Ví dụ, kết quả của “99987 / 9.1” là bao nhiêu? Không cần dành thời gian quý giá để giải các bài toán phức tạp. Độ chính xác tuyệt đối không bắt buộc. Hãy dùng số nguyên và giá trị xấp xỉ để đơn giản hóa bài toán. Ví dụ: “100,000 / 10”.
* Ghi lại các giả định. Viết các giả định ra là một ý hay để có thể tham khảo về sau.
* Ghi rõ đơn vị. Khi bạn viết “5”, đó là 5 KB hay 5 MB? Điều này có thể khiến bạn bối rối. Hãy ghi đơn vị, vì “5 MB” giúp loại bỏ sự mơ hồ.
* Các câu hỏi ước tính sơ bộ thường gặp gồm: QPS, QPS cao điểm, dung lượng lưu trữ, cache, số lượng server, v.v. Khi chuẩn bị phỏng vấn, bạn có thể luyện tập các phép tính này. Luyện tập giúp bạn thành thạo.

Chúc mừng bạn đã đi đến đây! Bây giờ, hãy tự động viên mình một chút. Làm tốt lắm!

#### Tài liệu tham khảo

\[1] J. Dean. Mẹo chuyên môn của Google: Sử dụng ước tính sơ bộ để chọn thiết kế tối ưu: <http://highscalability.com/blog/2011/1/26/google-pro-tip-use-back-of-the-envelope-calculations-to-choo.html>

\[2] Cẩm nang nhập môn system design:<https://github.com/donnemartin/system-design-primer>

\[3] Các số liệu về độ trễ mà mọi lập trình viên nên biết:<https://colin-scott.github.io/personal_website/research/interactive_latency.html>

\[4] Thỏa thuận cấp độ dịch vụ của Amazon Compute:<https://aws.amazon.com/compute/sla/>

\[5] Thỏa thuận cấp độ dịch vụ của Compute Engine (SLA):<https://cloud.google.com/compute/sla>

\[6] Tóm tắt SLA của các dịch vụ Azure:<https://azure.microsoft.com/en-us/support/legal/sla/summary/>
