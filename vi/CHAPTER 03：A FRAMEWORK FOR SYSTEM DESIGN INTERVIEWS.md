# Chương 03: Khung phỏng vấn thiết kế hệ thống

Bạn vừa nhận được cơ hội phỏng vấn onsite mà mình hằng mơ ước. Điều phối viên tuyển dụng gửi cho bạn lịch trình trong ngày. Xem hết lịch trình, bạn thấy mọi thứ đều ổn, cho đến khi nhìn thấy phần phỏng vấn này - phỏng vấn thiết kế hệ thống.

Phỏng vấn thiết kế hệ thống thường khiến người ta e ngại, vì đề bài có thể mơ hồ như “Thiết kế một sản phẩm nổi tiếng X?”. Những câu hỏi này không rõ ràng và có vẻ quá rộng. Mối lo của bạn là hoàn toàn dễ hiểu. Suy cho cùng, thiết kế một sản phẩm phổ biến vốn đã được hàng trăm, thậm chí hàng nghìn kỹ sư xây dựng trong vòng một giờ dường như là điều bất khả thi, đúng không?

Tin tốt là không ai kỳ vọng bạn làm như vậy. Thiết kế hệ thống trong thế giới thực rất phức tạp. Ví dụ, Google Search trông có vẻ đơn giản; tuy nhiên, số lượng công nghệ đứng sau sự đơn giản đó thực sự đáng kinh ngạc. Nếu không ai kỳ vọng bạn thiết kế một hệ thống thực tế trong một giờ, vậy phỏng vấn thiết kế hệ thống có ích gì?

Phỏng vấn thiết kế hệ thống mô phỏng quá trình giải quyết vấn đề trong thực tế: hai đồng nghiệp cùng nhau giải quyết một vấn đề mơ hồ và đưa ra một giải pháp phù hợp với mục tiêu của họ. Đây là một câu hỏi mở, không có đáp án hoàn hảo. So với nỗ lực bạn bỏ ra trong quá trình thiết kế, bản thiết kế cuối cùng không quan trọng bằng. Điều này cho phép bạn thể hiện kỹ năng thiết kế, bảo vệ các lựa chọn thiết kế của mình và phản hồi nhận xét theo cách mang tính xây dựng.

Hãy thử nhìn vấn đề từ một góc độ khác: hãy nghĩ xem điều gì đang diễn ra trong đầu người phỏng vấn khi cô ấy bước vào phòng họp để gặp bạn. Mục tiêu hàng đầu của người phỏng vấn là đánh giá chính xác năng lực của bạn. Điều cô ấy không muốn nhất là phải đưa ra một đánh giá không có kết luận vì buổi phỏng vấn diễn ra không suôn sẻ và không có đủ thông tin. Người phỏng vấn muốn đạt được điều gì qua phỏng vấn thiết kế hệ thống?

Nhiều người cho rằng phỏng vấn thiết kế hệ thống chỉ liên quan đến năng lực thiết kế kỹ thuật của một người. Thực tế không phải vậy. Phỏng vấn thiết kế hệ thống hiệu quả thể hiện nhiều hơn ở khả năng hợp tác, khả năng làm việc dưới áp lực và khả năng giải quyết vấn đề mơ hồ theo cách mang tính xây dựng. **Khả năng đặt câu hỏi hay cũng là một kỹ năng quan trọng, và nhiều người phỏng vấn đặc biệt coi trọng kỹ năng này.**

Một người phỏng vấn tốt cũng sẽ tìm kiếm các dấu hiệu cảnh báo. Over-design là vấn đề thực sự của nhiều kỹ sư, vì họ thích sự thuần túy của thiết kế mà bỏ qua trade-off. Họ thường không nhận ra chi phí tích lũy của việc thiết kế quá mức một hệ thống, và nhiều công ty đã phải trả giá đắt cho sự thiếu nhận thức này. Tất nhiên, bạn không muốn thể hiện khuynh hướng đó trong buổi phỏng vấn thiết kế hệ thống. Những dấu hiệu cảnh báo khác bao gồm tư duy hạn hẹp, cứng đầu, v.v.

Trong chương này, chúng ta sẽ giới thiệu một số kỹ thuật hữu ích và một framework đơn giản nhưng hiệu quả để giải quyết các câu hỏi phỏng vấn thiết kế hệ thống.

### Quy trình 4 bước để phỏng vấn thiết kế hệ thống hiệu quả

Mỗi buổi phỏng vấn thiết kế hệ thống đều khác nhau. Một buổi phỏng vấn thiết kế hệ thống xuất sắc thường là một bài toán mở, không có giải pháp dùng được cho mọi trường hợp. Tuy nhiên, mọi buổi phỏng vấn thiết kế hệ thống đều có một số bước và điểm chung cần được đề cập.

#### Bước 1: Hiểu vấn đề và xác định phạm vi thiết kế

“Tại sao hổ gầm?”

Một cánh tay giơ lên ở cuối lớp.

“Đúng rồi, Jimmy?”, giáo viên trả lời.

“Vì nó đói ạ.”

“Rất tốt, Jimmy.”

Trong suốt thời thơ ấu, Jimmy luôn là người đầu tiên trong lớp trả lời câu hỏi. Mỗi khi giáo viên đặt câu hỏi, trong lớp luôn có một đứa trẻ thích trả lời, bất kể có biết đáp án hay không. Đó chính là Jimmy.

Jimmy là một học sinh giỏi và tự hào vì mình luôn nhanh chóng biết mọi đáp án. Trong các kỳ thi, cậu thường là người đầu tiên hoàn thành bài. Trong mọi cuộc thi học thuật, cậu luôn là lựa chọn đầu tiên của giáo viên.

Đừng giống Jimmy.

Trong phỏng vấn thiết kế hệ thống, việc nhanh chóng đưa ra câu trả lời mà không suy nghĩ không giúp bạn ghi điểm. **Trả lời khi chưa hiểu kỹ yêu cầu là một dấu hiệu cảnh báo**, vì buổi phỏng vấn không phải là một cuộc thi trả lời nhanh. Những câu hỏi này thường không có đáp án đúng duy nhất.

Là kỹ sư, chúng ta thích giải quyết những vấn đề hóc búa và lao ngay vào bản thiết kế cuối cùng; tuy nhiên, cách tiếp cận này rất dễ khiến bạn thiết kế nhầm hệ thống. Là kỹ sư, một trong những kỹ năng quan trọng nhất là **đặt đúng câu hỏi**, **đưa ra các giả định phù hợp** và **thu thập mọi thông tin cần thiết để xây dựng một hệ thống**. Vì vậy, **đừng ngại đặt câu hỏi**.

Khi bạn đặt câu hỏi, người phỏng vấn sẽ trả lời trực tiếp hoặc yêu cầu bạn đưa ra giả định. Nếu là trường hợp thứ hai, hãy ghi các giả định đó lên bảng hoặc giấy. Có thể sau này bạn sẽ cần đến chúng.

Nên hỏi gì? Hãy đặt câu hỏi để hiểu chính xác yêu cầu. Dưới đây là danh sách câu hỏi giúp bạn bắt đầu:

* Chúng ta cần phát triển những tính năng cụ thể nào?
* Sản phẩm này có bao nhiêu người dùng?
* Công ty dự kiến mở rộng quy mô với tốc độ thế nào? Quy mô dự kiến sau 3 tháng, 6 tháng và 1 năm là bao nhiêu?
* Tech stack của công ty là gì? Có những service hiện có nào có thể tận dụng để đơn giản hóa thiết kế?

**Ví dụ**

Nếu được yêu cầu thiết kế một hệ thống news feed, bạn sẽ muốn đặt một số câu hỏi để giúp hiểu yêu cầu. Đoạn hội thoại giữa bạn và người phỏng vấn có thể diễn ra như sau:

Ứng viên: Đây là mobile app, web app hay cả hai?

Người phỏng vấn: Cả hai.

Ứng viên: Tính năng quan trọng nhất của sản phẩm là gì?

Người phỏng vấn: Có thể đăng bài và xem news feed của bạn bè.

Ứng viên: News feed được sắp xếp theo thứ tự thời gian hay theo một thứ tự cụ thể? Thứ tự cụ thể nghĩa là mỗi bài đăng có một trọng số khác nhau. Ví dụ, bài đăng từ bạn thân quan trọng hơn bài đăng từ một group.

Người phỏng vấn: Để đơn giản, hãy giả sử news feed được sắp xếp theo thứ tự thời gian.

Ứng viên: Một người dùng có thể có tối đa bao nhiêu người bạn?

Người phỏng vấn: 5000 người.

Ứng viên: Traffic lớn đến mức nào?

Người phỏng vấn: 10 triệu người dùng hoạt động hàng ngày (DAU).

Ứng viên: News feed có thể chứa hình ảnh, video hay chỉ có text?

Người phỏng vấn: Có thể chứa media file, bao gồm hình ảnh và video.

Trên đây là một số câu hỏi bạn có thể đặt cho người phỏng vấn. Việc hiểu yêu cầu và làm rõ những điểm chưa rõ là rất quan trọng.

#### Bước 2: Đưa ra thiết kế cấp cao và đạt được sự đồng thuận

Ở bước này, mục tiêu của chúng ta là xây dựng một thiết kế cấp cao và đạt được sự đồng thuận với người phỏng vấn về thiết kế đó. Trong quá trình này, phối hợp với người phỏng vấn là một ý tưởng hay.

* Đưa ra một blueprint thiết kế ban đầu. Xin feedback. Hãy coi người phỏng vấn như một teammate và cùng làm việc với họ. Nhiều người phỏng vấn giỏi thích trò chuyện và tham gia vào quá trình này.
* Vẽ sơ đồ khối của các thành phần chính lên bảng hoặc giấy. Các thành phần này có thể bao gồm client (mobile/web), API, web server, data storage, cache, CDN, message queue, v.v.
* Thực hiện một số phép tính sơ bộ để đánh giá xem blueprint của bạn có đáp ứng các giới hạn về quy mô hay không. Vừa suy nghĩ vừa nói ra. Nếu cần tính toán sơ bộ trước khi đi sâu hơn, hãy trao đổi với người phỏng vấn.

Nếu có thể, hãy đi qua một số use case cụ thể. Điều này sẽ giúp bạn xác định framework cho thiết kế cấp cao. Use case cũng có thể giúp bạn phát hiện các edge case mà bạn chưa cân nhắc.

Chúng ta có nên đưa các API endpoint và database schema vào đây không? Điều này phụ thuộc vào câu hỏi hiện tại. Với một bài toán thiết kế lớn như “Thiết kế Google Search engine”, việc đó hơi quá low-level. Với một bài toán như thiết kế backend cho một game poker nhiều người chơi, đây là điều hợp lý.

Hãy trao đổi với người phỏng vấn.

**Ví dụ**

Hãy lấy “thiết kế một hệ thống news feed” làm ví dụ để minh họa cách thực hiện thiết kế cấp cao. Ở đây, bạn không cần biết hệ thống thực sự hoạt động như thế nào. Tất cả chi tiết sẽ được giải thích trong Chương 11.

Ở cấp cao, thiết kế được chia thành hai flow: fan-out khi publish và xây dựng news feed.

* Fan-out khi publish: Khi người dùng đăng bài, dữ liệu tương ứng được ghi vào cache/database, đồng thời bài đăng sẽ xuất hiện trong news feed của bạn bè.
* Xây dựng news feed: News feed được xây dựng bằng cách aggregate các bài đăng của bạn bè theo thứ tự thời gian giảm dần.

Hình 3-1 và Hình 3-2 lần lượt minh họa thiết kế cấp cao của flow fan-out khi publish và flow xây dựng news feed.

![](../images/chapter3/figure3-1.jpg)

![](../images/chapter3/figure3-2.jpg)

#### Bước 3: Đi sâu vào thiết kế

Ở bước này, bạn và người phỏng vấn lẽ ra đã đạt được các mục tiêu sau:

* Thống nhất về mục tiêu tổng thể và phạm vi chức năng
* Phác thảo một blueprint cấp cao cho toàn bộ thiết kế
* Nhận feedback về thiết kế cấp cao từ người phỏng vấn
* Dựa trên feedback của cô ấy, có một số ý tưởng ban đầu về những khu vực cần tập trung khi đi sâu vào thiết kế

Bạn nên phối hợp với người phỏng vấn để xác định và ưu tiên các component trong kiến trúc. Cần nhấn mạnh rằng mỗi buổi phỏng vấn đều khác nhau. Đôi khi, người phỏng vấn có thể gợi ý rằng cô ấy muốn tập trung vào thiết kế cấp cao. Đôi khi, với buổi phỏng vấn dành cho ứng viên senior, cuộc thảo luận có thể đi vào các đặc tính hiệu năng của hệ thống, chủ yếu tập trung vào bottleneck và ước tính tài nguyên. Trong đa số trường hợp, người phỏng vấn có thể muốn bạn đi sâu vào chi tiết của một số component hệ thống. Với URL shortener, việc đào sâu vào thiết kế hash function để chuyển URL dài thành URL ngắn là một chủ đề thú vị. Với một chat system, cách giảm latency và hỗ trợ trạng thái online/offline là hai chủ đề thú vị.

Quản lý thời gian là yếu tố then chốt, vì bạn rất dễ bị cuốn vào những chi tiết vụn vặt không thể hiện năng lực của mình. Bạn nên chuẩn bị sẵn những điểm muốn thể hiện với người phỏng vấn. Cố gắng đừng sa đà vào những chi tiết không cần thiết. Ví dụ, nói quá chi tiết về thuật toán EdgeRank để xếp hạng Facebook feed trong một buổi phỏng vấn thiết kế hệ thống là không lý tưởng, vì việc này tiêu tốn nhiều thời gian quý báu nhưng không chứng minh được năng lực thiết kế hệ thống có khả năng scale của bạn.

**Ví dụ**

Đến đây, chúng ta đã thảo luận về thiết kế cấp cao của hệ thống news feed và người phỏng vấn hài lòng với đề xuất của bạn. Tiếp theo, chúng ta sẽ khảo sát hai use case quan trọng nhất:

1. Publish news feed
2. Truy xuất news feed

Hình 3-3 và Hình 3-4 thể hiện thiết kế chi tiết của hai use case, nội dung này sẽ được trình bày chi tiết trong Chương 11.

![](../images/chapter3/figure3-3.jpg)

![](../images/chapter3/figure3-4.jpg)

#### Bước 4: Tổng kết

Ở bước cuối cùng này, người phỏng vấn có thể đặt cho bạn một số câu hỏi tiếp nối hoặc cho phép bạn tự do thảo luận về các điểm bổ sung khác. Dưới đây là một số hướng có thể tiếp tục:

* Người phỏng vấn có thể muốn bạn tìm ra bottleneck của hệ thống và thảo luận về những cải tiến tiềm năng. Tuyệt đối đừng nói rằng thiết kế của bạn hoàn hảo và không thể cải thiện thêm. Luôn có thứ có thể cải thiện. Đây là cơ hội tốt để thể hiện tư duy phản biện và tạo ấn tượng cuối cùng tốt đẹp.
* Việc tóm tắt lại thiết kế của bạn cho người phỏng vấn có thể hữu ích. Điều này đặc biệt quan trọng nếu bạn đã đưa ra nhiều giải pháp. Sau một buổi trao đổi dài, việc nhắc lại có thể giúp ích cho người phỏng vấn.
* Các tình huống lỗi (server gặp sự cố, mất network, v.v.) đáng được thảo luận.
* Các vấn đề vận hành cũng đáng được đề cập. Làm thế nào để monitor metric và error log? Hệ thống được rollout như thế nào?
* Cách xử lý quy mô ở nấc tiếp theo cũng là một chủ đề thú vị. Ví dụ, nếu thiết kế hiện tại hỗ trợ 1 triệu người dùng, bạn cần thay đổi gì để hỗ trợ 10 triệu người dùng?
* Nếu có thêm thời gian, bạn có thể đề xuất các cải tiến khác.

Cuối cùng, chúng ta đã tổng hợp một danh sách “Nên làm” và “Không nên làm”.

* **Nên làm**
  * Hỏi cho rõ. Đừng cho rằng các giả định của bạn là đúng.
  * Hiểu các yêu cầu của vấn đề.
  * Không có đáp án đúng duy nhất hay đáp án tốt nhất. Một giải pháp được thiết kế để giải quyết vấn đề của một startup non trẻ sẽ khác với giải pháp dành cho một công ty lâu đời có hàng triệu người dùng. Hãy chắc chắn rằng bạn hiểu yêu cầu.
  * Cho người phỏng vấn biết bạn đang suy nghĩ gì. Hãy trao đổi với người phỏng vấn.
  * Nếu có thể, hãy đưa ra nhiều cách tiếp cận.
  * Một khi đã thống nhất blueprint với người phỏng vấn, hãy mô tả chi tiết từng component. Thiết kế những phần quan trọng nhất trước.
  * Chia sẻ ý tưởng với người phỏng vấn. Một người phỏng vấn tốt sẽ coi bạn là teammate và cùng phối hợp với bạn.
  * Không bao giờ bỏ cuộc.
* **Không nên làm**
  * Đừng đến buổi phỏng vấn mà không chuẩn bị gì cho những câu hỏi phỏng vấn phổ biến.
  * Đừng vội đề xuất giải pháp khi chưa làm rõ yêu cầu và các giả định.
  * Khi mới bắt đầu, đừng đi quá sâu vào chi tiết của một component duy nhất. Trước tiên hãy đưa ra thiết kế cấp cao, sau đó mới đi sâu hơn.
  * Nếu bị mắc kẹt, đừng ngần ngại xin gợi ý.
  * Nhắc lại một lần nữa: hãy trao đổi. Đừng im lặng suy nghĩ.
  * Đừng nghĩ rằng buổi phỏng vấn kết thúc ngay khi bạn đưa ra thiết kế. Bạn chỉ hoàn thành khi người phỏng vấn nói rằng bạn đã xong. Hãy xin feedback sớm và thường xuyên.
*   **Phân bổ thời gian cho từng bước**

    Các câu hỏi phỏng vấn thiết kế hệ thống thường rất rộng, và 45 phút hoặc một giờ không đủ để bao quát toàn bộ thiết kế. Quản lý thời gian là yếu tố quan trọng. Nên dành bao nhiêu thời gian cho mỗi bước? Dưới đây là hướng dẫn rất sơ bộ về cách phân bổ thời gian trong một buổi phỏng vấn kéo dài 45 phút. Hãy nhớ rằng đây chỉ là ước tính sơ bộ; việc phân bổ thời gian thực tế phụ thuộc vào phạm vi câu hỏi và yêu cầu của người phỏng vấn.

    * Bước 1 Hiểu vấn đề và xác định phạm vi thiết kế: 3-10 phút
    * Bước 2 Đưa ra thiết kế cấp cao và đạt được sự đồng thuận: 10-15 phút
    * Bước 3 Đi sâu vào thiết kế: 10-25 phút
    * Bước 4 Tổng kết: 3-5 phút
