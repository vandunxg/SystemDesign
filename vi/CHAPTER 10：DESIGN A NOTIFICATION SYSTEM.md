# Chương 10: Thiết kế một hệ thống thông báo


Trong những năm gần đây, hệ thống thông báo đã trở thành một tính năng rất phổ biến trong nhiều ứng dụng. Thông báo nhắc người dùng về những thông tin quan trọng như tin nóng, cập nhật sản phẩm, sự kiện, ưu đãi, v.v. Nó đã trở thành một phần không thể thiếu trong cuộc sống hằng ngày của chúng ta. Trong chương này, bạn sẽ thiết kế một hệ thống thông báo.

Thông báo không chỉ là push notification trên mobile. Có ba loại định dạng thông báo: push notification trên mobile, SMS và email. Hình 10-1 minh họa ví dụ về từng loại thông báo.

![](../images/chapter10/figure10-1.jpg)

### Bước 1: Hiểu vấn đề và xác định phạm vi thiết kế

Xây dựng một hệ thống có khả năng mở rộng để gửi hàng triệu thông báo mỗi ngày không phải là việc dễ dàng. Điều này đòi hỏi hiểu biết sâu về hệ sinh thái thông báo. Câu hỏi phỏng vấn được cố ý thiết kế theo hướng mở và mơ hồ; bạn có trách nhiệm đặt câu hỏi để làm rõ yêu cầu.

Ứng viên: Hệ thống hỗ trợ những loại thông báo nào? Người phỏng vấn: Push notification, SMS, email.

Ứng viên: Đây có phải là hệ thống realtime không?

Người phỏng vấn: Hãy xem đây là một hệ thống soft realtime. Chúng tôi muốn người dùng nhận được thông báo sớm nhất có thể. Tuy nhiên, nếu hệ thống đang chịu tải cao thì chậm một chút vẫn có thể chấp nhận được.

Ứng viên: Hệ thống hỗ trợ những thiết bị nào?

Người phỏng vấn: Thiết bị iOS, thiết bị Android và laptop/desktop.

Ứng viên: Điều gì trigger thông báo?

Người phỏng vấn: Thông báo có thể được trigger bởi client application. Chúng cũng có thể được server-side scheduler lên lịch.

Ứng viên: Người dùng có thể opt out không?

Người phỏng vấn: Có, những người dùng opt out sẽ không nhận được thông báo nữa.

Ứng viên: Mỗi ngày có bao nhiêu thông báo được gửi đi?

Người phỏng vấn: 10 triệu push notification trên mobile, 1 triệu SMS và 5 triệu email.

### Bước 2: Đưa ra thiết kế cấp cao và nhận được sự đồng thuận

Phần này trình bày thiết kế cấp cao hỗ trợ nhiều loại thông báo: push notification trên iOS, push notification trên Android, SMS và email. Cấu trúc của thiết kế như sau:

* Các loại thông báo khác nhau
* Quy trình thu thập thông tin liên hệ
* Quy trình gửi/nhận thông báo

#### Các loại thông báo khác nhau

Trước tiên, hãy xem ở cấp cao mỗi loại thông báo hoạt động như thế nào.

**Push notification trên iOS**

![](../images/chapter10/figure10-2.jpg)

Để gửi push notification trên iOS, chúng ta chủ yếu cần ba component:

1. Provider: Provider tạo notification request và gửi request đó đến Apple Push Notification Service (APNS). Để tạo push notification, provider cung cấp các dữ liệu sau:
   1. Device token: Đây là identifier duy nhất được dùng để gửi push notification.
   2. Payload: Đây là một JSON dictionary chứa notification payload. Ví dụ:

       ```json
       {
           "aps": {
               "alert": {
                   "title": "Game Request",
                   "body": "Bob wants to play chess",
                   "action-loc-key": "PLAY"
               },
               "badge": 5
           }
       }
       ```
2. Apple Push Notification Service (APNS): Đây là remote service do Apple cung cấp để phân phối push notification đến thiết bị iOS.
3. Thiết bị iOS: Đây là client endpoint nhận push notification.

**Push notification trên Android**

Android sử dụng quy trình thông báo tương tự. Firebase Cloud Messaging (FCM) thường được dùng để gửi push notification đến thiết bị Android thay vì APN.

![](../images/chapter10/figure10-3.jpg)

**SMS**

Đối với SMS, người ta thường sử dụng third-party SMS service như Twilio\[1], Nexmo\[2] và nhiều dịch vụ khác. Phần lớn trong số đó là các dịch vụ thương mại.

![](../images/chapter10/figure10-4.jpg)

**Email**

Mặc dù các công ty có thể tự thiết lập email server, nhiều công ty chọn sử dụng commercial email service. Sendgrid \[3] và Mailchimp \[4] là một trong những email service phổ biến nhất; chúng cung cấp delivery rate và data analytics tốt hơn.

![](../images/chapter10/figure10-5.jpg)

Hình 10-6 hiển thị thiết kế sau khi bổ sung tất cả third-party service.

![](../images/chapter10/figure10-6.jpg)

#### Quy trình thu thập thông tin liên hệ

Để gửi thông báo, chúng ta cần thu thập device token của mobile, số điện thoại hoặc địa chỉ email. Như minh họa trong Hình 10-7, khi người dùng cài đặt application hoặc đăng ký lần đầu, API server sẽ thu thập thông tin liên hệ của người dùng và lưu vào database.

![](../images/chapter10/figure10-7.jpg)

Hình 10-8 hiển thị database table đơn giản dùng để lưu thông tin liên hệ. Địa chỉ email và số điện thoại được lưu trong user table, còn device token được lưu trong device table. Một người dùng có thể có nhiều device, nghĩa là push notification có thể được gửi đến tất cả device của người dùng.

![](../images/chapter10/figure10-8.jpg)

#### Quy trình gửi/nhận thông báo

Trước tiên, chúng ta sẽ giới thiệu thiết kế ban đầu, sau đó đưa ra một số phương án tối ưu hóa.

**Thiết kế cấp cao**

Hình 10-9 hiển thị thiết kế; phần dưới đây giải thích từng system component.

![](../images/chapter10/figure10-9.jpg)

**Service 1 đến N**: Một service có thể là một microservice, một cron job hoặc một distributed system trigger event gửi thông báo. Ví dụ, một billing service gửi email nhắc khách hàng thanh toán khi đến hạn, hoặc một website mua sắm dùng SMS thông báo cho khách hàng rằng gói hàng của họ sẽ được giao vào ngày mai.

**Notification system**: Notification system là trung tâm gửi/nhận thông báo. Bắt đầu từ một hệ thống đơn giản, chúng ta chỉ sử dụng một notification server. Server này cung cấp API cho Service 1 đến N và xây dựng notification payload cho third-party service.

**Third-party service**: Third-party service chịu trách nhiệm gửi thông báo đến người dùng. Khi tích hợp với third-party service, chúng ta cần đặc biệt chú ý đến khả năng mở rộng. Khả năng mở rộng tốt có nghĩa là hệ thống linh hoạt, dễ dàng thêm hoặc gỡ một third-party service. Một điểm cần cân nhắc quan trọng khác là third-party service có thể không khả dụng ở một thị trường mới hoặc trong tương lai. Ví dụ, FCM không khả dụng ở Trung Quốc. Vì vậy, tại đó cần sử dụng third-party service thay thế như Jpush, PushY, v.v.

**iOS, Android, SMS, Email**: Người dùng nhận thông báo trên device của họ.

Thiết kế này có ba vấn đề:

1. Single point of failure (SPOF): Một notification server duy nhất tạo ra SPOF.
2. Khó scale: Notification system xử lý mọi việc liên quan đến push notification trên một server. Việc scale độc lập database, cache và các notification processing component khác là một thách thức.
3. Performance bottleneck: Xử lý và gửi thông báo có thể tiêu tốn nhiều resource. Ví dụ, việc xây dựng HTML page và chờ response từ third-party service có thể mất thời gian. Xử lý mọi việc trong một hệ thống có thể khiến hệ thống quá tải, đặc biệt vào giờ cao điểm.

**Thiết kế cấp cao (đã cải tiến)**

Sau khi liệt kê các thách thức trong thiết kế ban đầu, chúng ta cải tiến thiết kế như sau:

* Tách database và cache khỏi notification server
* Bổ sung thêm notification server và thiết lập automatic horizontal scaling
* Đưa message queue vào để decouple các system component

Hình 10-10 hiển thị thiết kế cấp cao đã cải tiến.

![](../images/chapter10/figure10-10.jpg)

Cách tốt nhất để đọc sơ đồ trên là đi từ trái sang phải.

* **Service 1 đến N**: Đại diện cho các service khác nhau, gửi thông báo thông qua API do notification server cung cấp.
* **Notification server**: Cung cấp các chức năng sau:
  * Cung cấp API gửi thông báo cho service. Các API này chỉ có thể được truy cập bởi client nội bộ hoặc client đã được xác thực để ngăn spam.
  * Thực hiện validation cơ bản để kiểm tra email, số điện thoại, v.v.
  * Query database hoặc cache để lấy dữ liệu cần thiết cho việc render notification.
  * Đưa notification data vào message queue để xử lý song song.

      Dưới đây là ví dụ về API gửi email:

      POST https://api.example.com/v/sms/send

      Request body:

      ![](../images/chapter10/figure10-hello.jpg)
* **Cache**: Thông tin người dùng, thông tin device và notification template được cache.
* **Database**: Lưu trữ dữ liệu về người dùng, thông báo, setting, v.v.
* **Message queue**: Loại bỏ dependency giữa các component. Khi có lượng lớn thông báo được gửi đi, message queue có thể đóng vai trò buffer. Mỗi loại thông báo được gán một message queue riêng, nên sự gián đoạn của một third-party service sẽ không ảnh hưởng đến các loại thông báo khác.
* **Workers**: Là một nhóm server pull notification event từ message queue và gửi chúng đến third-party service tương ứng.
* **Third-party service**: Đã được giải thích trong thiết kế ban đầu.
* **iOS, Android, SMS, Email**: Đã được trình bày trong thiết kế ban đầu.

Tiếp theo, hãy xem từng component phối hợp với nhau như thế nào để gửi thông báo.

1. Một service gọi API do notification server cung cấp để gửi thông báo.
2. Notification server lấy metadata như thông tin người dùng, device token và notification setting từ cache hoặc database.
3. Một notification event được gửi đến queue tương ứng để xử lý. Ví dụ, một event push notification trên iOS được gửi đến iOS PN queue.
4. Worker lấy notification event từ message queue.
5. Worker gửi thông báo đến third-party service.
6. Third-party service gửi thông báo đến device của người dùng.

### Bước 3: Đi sâu vào thiết kế

Trong thiết kế cấp cao, chúng ta đã thảo luận về các loại thông báo khác nhau, quy trình thu thập thông tin liên hệ và quy trình gửi/nhận thông báo. Chúng ta sẽ đi sâu vào các nội dung sau.

* **Reliability** (**Độ tin cậy**)
* Các component và yếu tố cần cân nhắc khác: notification template, notification setting, rate limiting, retry mechanism, bảo mật của push notification, monitoring notification đang xếp hàng và event tracking.
* Thiết kế được cập nhật

#### Độ tin cậy

Khi thiết kế notification system trong môi trường distributed, chúng ta phải trả lời một số câu hỏi quan trọng về reliability.

**Làm thế nào để ngăn mất dữ liệu?**

Một trong những yêu cầu quan trọng nhất của notification system là không được làm mất dữ liệu. Thông báo thường có thể bị trì hoãn hoặc gửi không theo thứ tự, nhưng tuyệt đối không được mất. Để đáp ứng yêu cầu này, notification system **persist notification data vào database** và triển khai retry mechanism. Notification log database được bổ sung để persist data, như minh họa trong Hình 10-11.

![](../images/chapter10/figure10-11.jpg)

**Người nhận chỉ nhận một thông báo đúng một lần phải không?**

Câu trả lời ngắn gọn nhất là không. Mặc dù phần lớn thời gian thông báo chỉ được gửi một lần, đặc tính distributed có thể dẫn đến thông báo trùng lặp. Để giảm khả năng trùng lặp, chúng ta đưa vào cơ chế deduplication và xử lý cẩn thận từng trường hợp failure. Đây là một logic deduplication đơn giản:

Khi một notification event đến lần đầu, chúng ta kiểm tra xem event đó đã từng xuất hiện hay chưa bằng cách kiểm tra ID của event. Nếu đã xuất hiện, event sẽ bị loại bỏ. Nếu chưa, chúng ta gửi thông báo. Bạn đọc có thể tìm hiểu vì sao không thể chỉ gửi một lần trong tài liệu tham khảo \[5].

#### Các component và yếu tố cần cân nhắc khác

Chúng ta đã thảo luận về cách thu thập thông tin liên hệ của người dùng, cũng như gửi và nhận thông báo. Một notification system còn nhiều hơn thế. Ở đây, chúng ta thảo luận về các component bổ sung, bao gồm tái sử dụng template, notification setting, event tracking, system monitoring, rate limiting, v.v.

*   Notification template

    Một notification system lớn gửi hàng triệu thông báo mỗi ngày, trong đó nhiều thông báo có format tương tự nhau. Notification template được đưa vào để tránh phải xây dựng từng thông báo từ đầu. Notification template là một thông báo được format sẵn, qua đó bạn tạo ra thông báo riêng bằng các parameter tùy chỉnh, style, tracking link, v.v. Dưới đây là một template ví dụ cho push notification.

    ```
    BODY:
    You dreamed of it. We dared it. [ITEM NAME] is back — only until [DATE].
    CTA:
    Order Now. Or, Save My [ITEM NAME]
    The benefits of using notification templates include maintaining a consistent format, reducing
    the margin error, and saving time.
    ```
*   Notification setting

    Người dùng thường nhận quá nhiều thông báo mỗi ngày và rất dễ cảm thấy quá tải. Vì vậy, nhiều website và application cho phép người dùng kiểm soát chi tiết notification setting. Những thông tin này được lưu trong notification setting table, với các field sau:

    ```
    user_id   bigInt
    channel  varchar    # push notification, email or SMS
    opt_in   boolean    # opt-in to receive notification
    ```

    Trước khi gửi bất kỳ thông báo nào đến người dùng, trước tiên chúng ta kiểm tra xem người dùng có opt in để nhận loại thông báo đó hay không.
*   Rate limiting

    Để tránh làm người dùng ngập trong quá nhiều thông báo, chúng ta có thể giới hạn số lượng thông báo mà một người dùng được nhận. Điều này quan trọng vì nếu gửi quá thường xuyên, người nhận có thể tắt hoàn toàn thông báo.
*   Retry mechanism

    Khi third-party service không thể gửi thông báo, thông báo đó sẽ được thêm vào message queue để retry. Nếu vấn đề vẫn tiếp diễn, developer sẽ nhận được alert.
*   Vấn đề bảo mật của push notification

    Đối với application iOS hoặc Android, appKey và appSecret được dùng để bảo vệ push notification API\[6]. Chỉ client đã authenticate hoặc verify mới được phép sử dụng API của chúng ta để gửi push notification. Người đọc quan tâm có thể tham khảo tài liệu \[6].
*   Monitoring notification đang xếp hàng

    Một metric quan trọng cần monitor là tổng số notification đang xếp hàng. Nếu con số này lớn, điều đó cho thấy worker xử lý notification event chưa đủ nhanh. Để tránh chậm trễ trong việc delivery notification, cần bổ sung thêm worker. Hình 10-12 (ghi nhận từ \[7]) hiển thị một ví dụ về message đang chờ xử lý trong queue.

    ![](../images/chapter10/figure10-12.jpg)
*   Event tracking

    Các metric của notification như open rate, click-through rate và engagement rất quan trọng để hiểu hành vi khách hàng. Analytics service thực hiện event tracking. Thông thường cần có integration giữa notification system và analytics service. Hình 10-13 hiển thị ví dụ về các event có thể được track cho mục đích analytics.

    ![](../images/chapter10/figure10-13.jpg)

#### Thiết kế được cập nhật

Gom tất cả lại, Hình 10-14 hiển thị thiết kế notification system được cập nhật.

![](../images/chapter10/figure10-14.jpg)

Trong thiết kế này, so với thiết kế trước, nhiều component mới đã được bổ sung.

* Notification server được trang bị thêm hai chức năng quan trọng: authentication và rate limiting.
* Chúng ta cũng bổ sung **retry mechanism** để xử lý notification failure. Nếu hệ thống gửi thông báo thất bại, các thông báo đó sẽ được đưa lại vào message queue và worker sẽ retry số lần đã định.
* Ngoài ra, notification template cung cấp quy trình tạo thông báo nhất quán và hiệu quả.
* Cuối cùng, hệ thống monitoring và tracking được bổ sung để health check hệ thống và cải tiến trong tương lai.

### Bước 4: Tóm tắt

Thông báo là thành phần không thể thiếu vì giúp chúng ta nắm được thông tin quan trọng kịp thời. Đó có thể là push notification về bộ phim yêu thích của bạn trên Netflix, email về ưu đãi của sản phẩm mới hoặc thông tin xác nhận thanh toán khi bạn mua sắm online.

Trong chương này, chúng ta đã mô tả thiết kế một notification system có khả năng mở rộng và hỗ trợ nhiều định dạng thông báo: push notification, SMS và email. Chúng ta sử dụng message queue để decouple các system component.

Ngoài thiết kế cấp cao, chúng ta còn đi sâu vào nhiều component và phương án tối ưu hóa khác.

* Reliability: Chúng ta đề xuất một retry mechanism mạnh để giảm thiểu tỷ lệ failure.
* Security: AppKey/appSecret được dùng để đảm bảo chỉ client đã được xác thực mới có thể gửi thông báo.
* Tracking và monitoring: Được triển khai ở mọi giai đoạn của notification flow để thu thập các số liệu quan trọng.
* Tôn trọng notification setting của người dùng: Người dùng có thể chọn không nhận thông báo. Hệ thống trước tiên kiểm tra notification setting của người dùng trước khi gửi thông báo.
* Rate limiting: Người dùng sẽ thích việc đặt giới hạn tần suất cho số lượng thông báo họ nhận được.

Chúc mừng bạn đã đi đến bước này! Hãy tự động viên mình, bạn đã làm rất tốt!

### Tài liệu tham khảo

* \[1] Twilio SMS: [https://www.twilio.com/sms](https://www.twilio.com/sms)
* \[2] Nexmo SMS: [https://www.nexmo.com/products/sms](https://www.nexmo.com/products/sms)
* \[3] Sendgrid: [https://sendgrid.com/](https://sendgrid.com/)
* \[4] Mailchimp: [https://mailchimp.com/](https://mailchimp.com/)
* \[5] You Cannot Have Exactly-Once Delivery: [https://bravenewgeek.com/you-cannot-have-exactly-once-delivery](https://bravenewgeek.com/you-cannot-have-exactly-once-delivery/)
* \[6] Security in Push Notifications: [https://cloud.ibm.com/docs/services/mobilepush](https://cloud.ibm.com/docs/services/mobilepush?topic=mobile-pushnotification-security-in-push-notifications)
* \[7] RabbitMQ: [https://bit.ly/2sotIa6](https://bit.ly/2sotIa6)
