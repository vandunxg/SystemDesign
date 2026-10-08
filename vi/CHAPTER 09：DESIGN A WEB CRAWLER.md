# Chương 09: Thiết kế web crawler


Chương này tập trung vào thiết kế web crawler, một câu hỏi phỏng vấn system design kinh điển và thú vị.

Web crawler còn được gọi là robot hoặc spider. Search engine sử dụng crawler rộng rãi để phát hiện nội dung mới hoặc nội dung đã được cập nhật trên Web. Nội dung có thể là trang web, hình ảnh, video, file PDF, v.v. Web crawler trước tiên thu thập một số trang web, sau đó lần theo các liên kết trên những trang đó để thu thập nội dung mới. Hình 9-1 minh họa trực quan quy trình crawling.

![](../images/chapter9/figure9-1.jpg)

Crawler có nhiều mục đích sử dụng:

* Lập chỉ mục cho search engine: Đây là use case phổ biến nhất. Crawler thu thập các trang web để tạo local index cho search engine. Ví dụ, Googlebot là web crawler đứng sau search engine Google.
* Lưu trữ web: Đây là quá trình thu thập thông tin từ web để lưu dữ liệu cho việc sử dụng sau này. Ví dụ, nhiều thư viện quốc gia vận hành crawler để lưu trữ các website. Những ví dụ nổi tiếng là Thư viện Quốc hội Hoa Kỳ \[1] và EU Web Archive \[2].
* Khai phá web: Sự phát triển bùng nổ của web mang lại cơ hội chưa từng có cho việc khai phá dữ liệu. Khai phá web giúp phát hiện tri thức hữu ích từ Internet. Ví dụ, các công ty tài chính hàng đầu sử dụng crawler để tải xuống biên bản họp cổ đông và báo cáo thường niên nhằm tìm hiểu các sáng kiến quan trọng của công ty.
* Giám sát web: Những crawler này giúp theo dõi hành vi vi phạm bản quyền và thương hiệu trên Internet. Ví dụ, Digimarc \[3] sử dụng crawler để phát hiện và báo cáo các tác phẩm bị vi phạm bản quyền.

Độ phức tạp khi phát triển web crawler phụ thuộc vào quy mô mà chúng ta muốn hỗ trợ. Đó có thể là một project nhỏ ở trường, hoàn thành chỉ trong vài giờ, hoặc một project lớn cần cả team engineering chuyên trách liên tục cải tiến. Vì vậy, dưới đây chúng ta sẽ tìm hiểu quy mô và các tính năng cần hỗ trợ.

### Bước 1: Tìm hiểu bài toán và xác định phạm vi thiết kế

Thuật toán cơ bản của web crawler khá đơn giản:

* Cho một tập URL, tải xuống tất cả các trang web mà những URL đó trỏ tới.
* Trích xuất URL từ các trang web này.
* Thêm các URL mới vào danh sách URL cần tải xuống. Lặp lại 3 bước này.

Web crawler có thực sự đơn giản như thuật toán cơ bản này không? Không hẳn. Thiết kế một web crawler có khả năng scale cao là một nhiệm vụ cực kỳ phức tạp. Gần như không ai có thể thiết kế một web crawler quy mô lớn trong thời gian phỏng vấn. Trước khi bắt đầu thiết kế, chúng ta phải đặt câu hỏi để **tìm hiểu yêu cầu và xác định phạm vi thiết kế**:

Ứng viên: Mục đích chính của crawler là gì? Nó dùng để lập chỉ mục cho search engine, khai phá dữ liệu hay phục vụ mục đích khác?

Người phỏng vấn: Lập chỉ mục cho search engine.

Ứng viên: Mỗi tháng web crawler thu thập bao nhiêu trang web?

Người phỏng vấn: 1 tỷ trang.

Ứng viên: Những loại nội dung nào được bao gồm? Chỉ HTML hay còn các loại khác như PDF và hình ảnh?

Người phỏng vấn: Chỉ HTML.

Ứng viên: Chúng ta có cần xét đến các trang web mới được thêm hoặc được chỉnh sửa không?

Người phỏng vấn: Có, chúng ta nên xét đến các trang web mới được thêm hoặc được chỉnh sửa.

Ứng viên: Chúng ta có cần lưu các trang HTML đã crawl từ web không?

Người phỏng vấn: Có, tối đa 5 năm.

Ứng viên: Chúng ta xử lý các trang có nội dung trùng lặp như thế nào?

Người phỏng vấn: Các trang có nội dung trùng lặp nên được bỏ qua.

Trên đây là một số câu hỏi mẫu bạn có thể hỏi người phỏng vấn. Việc tìm hiểu yêu cầu và làm rõ những điểm còn mơ hồ rất quan trọng. Ngay cả khi được yêu cầu thiết kế một sản phẩm đơn giản như web crawler, bạn và người phỏng vấn có thể đang dựa trên những giả định khác nhau.

Ngoài các tính năng cần làm rõ với người phỏng vấn, việc ghi nhớ các đặc điểm sau của một web crawler tốt cũng rất quan trọng:

* Khả năng scale (Scalability): Web rất lớn, với hàng tỷ trang web. Việc crawling song song trên web có thể mang lại hiệu quả rất cao.
* Tính robust (Robustness): Web đầy rẫy cạm bẫy. HTML sai, server không phản hồi, crash, các liên kết độc hại và nhiều vấn đề khác thường xuyên xảy ra. Crawler phải xử lý được tất cả edge case này.
* Tính lịch sự (Politeness): Crawler không nên gửi quá nhiều request đến một website trong khoảng thời gian ngắn.
* Tính mở rộng (Extensibility): Hệ thống cần đủ linh hoạt để hỗ trợ các loại nội dung mới với rất ít thay đổi. Ví dụ, nếu sau này chúng ta muốn crawl file hình ảnh, không nên phải thiết kế lại toàn bộ hệ thống.

#### Ước tính sơ bộ

Các ước tính dưới đây dựa trên nhiều giả định, vì vậy điều quan trọng là phải trao đổi với người phỏng vấn để thống nhất.

* Giả sử mỗi tháng tải xuống 1 tỷ trang web.
* QPS: $$1,000,000,000 / 30 ngày / 24 giờ / 3600 giây = 400 trang/giây.$$
* $$QPS đỉnh = 2 \times QPS = 800$$
* Giả sử kích thước trung bình của một trang web là 500k.
* $$1 tỷ trang \times 500k = 500 TB mỗi tháng$$ dung lượng lưu trữ. Nếu bạn chưa rõ về các đơn vị lưu trữ số, hãy đọc lại phần “Lũy thừa của 2” trong Chương 2.
* Giả sử lưu dữ liệu trong 5 năm, $$500 TB \times 12 tháng \times 5 năm = 30 PB$$. Cần 30 PB storage để lưu nội dung của 5 năm.

### Bước 2: Đề xuất thiết kế cấp cao và nhận được sự đồng thuận

Sau khi đã làm rõ yêu cầu, chúng ta bắt đầu thiết kế cấp cao. Lấy cảm hứng từ các nghiên cứu trước đây về web crawling \[4]\[5], chúng ta đề xuất thiết kế cấp cao như trong Hình 9-2.

![](../images/chapter9/figure9-2.jpg)

Trước tiên, chúng ta tìm hiểu từng component trong thiết kế để nắm được chức năng của chúng. Sau đó, chúng ta lần lượt xem xét workflow của crawler.

#### Seed URLs

Web crawler sử dụng seed URL làm điểm bắt đầu cho quá trình crawling. Ví dụ, để crawl tất cả các trang web của một trường đại học, một cách trực quan để chọn seed URL là sử dụng domain của trường.

Để crawl toàn bộ web, chúng ta cần lựa chọn seed URL một cách sáng tạo. Một seed URL tốt là điểm bắt đầu hiệu quả, cho phép crawler lần theo nhiều liên kết nhất có thể. Một chiến lược phổ biến là chia toàn bộ không gian URL thành các không gian nhỏ hơn. Cách tiếp cận đầu tiên dựa trên vị trí, vì các quốc gia khác nhau có thể có những website phổ biến khác nhau.

Một cách khác là chọn seed URL dựa trên chủ đề; chẳng hạn, chúng ta có thể chia không gian URL thành shopping, thể thao, chăm sóc sức khỏe, v.v. Việc chọn seed URL là một bài toán mở, bạn không cần đưa ra câu trả lời hoàn hảo mà hãy mạnh dạn suy nghĩ trước.

#### URL Frontier

Hầu hết web crawler hiện đại chia trạng thái crawling thành hai loại: đang chờ tải xuống và đã tải xuống. Component lưu các URL đang chờ tải xuống được gọi là URL Frontier. Bạn có thể hình dung nó như một queue first-in-first-out (FIFO). Hãy tham khảo phần nghiên cứu chuyên sâu để biết thêm chi tiết về URL Frontier.

#### HTML Downloader

HTML Downloader tải các trang web từ Internet. Các URL này được URL Frontier cung cấp.

#### DNS Resolver

Để tải một trang web, URL phải được chuyển đổi thành địa chỉ IP. HTML Downloader gọi DNS Resolver để lấy IP tương ứng với URL. Ví dụ, tính đến ngày 5 tháng 3 năm 2019, URL [www.wikipedia.org](http://www.wikipedia.org/) đã được chuyển thành địa chỉ IP 198.35.26.96.

#### Content Parser

Sau khi tải trang web, cần parse và validate trang vì các trang có format sai có thể gây ra sự cố và lãng phí storage. Việc triển khai content parser bên trong crawl server sẽ làm chậm quá trình crawling. Vì vậy, Content Parser là một component độc lập.

#### Content Seen?

Nghiên cứu trực tuyến \[6] cho thấy 29% trang web có nội dung trùng lặp, dẫn đến việc cùng một nội dung có thể bị lưu nhiều lần. Chúng ta đưa vào một data structure có tên “Content Seen?” để loại bỏ dữ liệu dư thừa và rút ngắn thời gian xử lý. Nó giúp phát hiện nội dung mới đã từng được lưu trong hệ thống. Để so sánh hai tài liệu HTML, chúng ta có thể so sánh từng ký tự một. Tuy nhiên, cách này chậm và tốn thời gian, đặc biệt khi có hàng tỷ trang web. Một cách hiệu quả để thực hiện việc này là so sánh hash của hai trang web \[7].

#### Content Storage

Đây là storage system dùng để lưu nội dung HTML. Việc lựa chọn storage system phụ thuộc vào các yếu tố như loại dữ liệu, kích thước dữ liệu, tần suất truy cập, thời gian lưu trữ, v.v.; cả disk và memory đều được sử dụng.

* Phần lớn nội dung được lưu trên disk vì dataset quá lớn, không thể đưa hết vào memory.
* Nội dung phổ biến được lưu trong memory để giảm latency.

#### URL Extractor

URL Extractor parse và trích xuất các liên kết từ trang HTML. Hình 9-3 minh họa một ví dụ về quá trình trích xuất liên kết. Các path tương đối được chuyển thành URL tuyệt đối bằng cách thêm prefix “[https://en.wikipedia.org](https://en.wikipedia.org/)”.

![](../images/chapter9/figure9-3.jpg)

#### URL Filter

URL Filter loại bỏ các URL thuộc một số loại nội dung nhất định, có phần mở rộng file nhất định, là liên kết lỗi hoặc thuộc các website trong “blacklist”.

#### URL Seen?

“URL Seen?” là một data structure dùng để theo dõi các URL đã được truy cập trước đó hoặc đã có trong Frontier. “URL Seen?” giúp tránh thêm cùng một URL nhiều lần, vì điều này có thể làm tăng tải cho server và dẫn đến vòng lặp vô hạn.

Bloom filter và hash table là các kỹ thuật phổ biến để triển khai component “URL Seen?”. Chúng ta sẽ không trình bày chi tiết cách triển khai Bloom filter và hash table ở đây. Để biết thêm thông tin, hãy tham khảo tài liệu tham khảo \[4]\[8].

#### URL Storage

URL Storage lưu các URL đã được truy cập. Đến đây, chúng ta đã thảo luận về từng component của hệ thống. Tiếp theo, chúng ta sẽ kết hợp chúng để giải thích workflow.

#### Workflow của web crawler

Để giải thích workflow từng bước rõ hơn, chúng ta thêm số thứ tự vào sơ đồ thiết kế như trong Hình 9-4.

![](../images/chapter9/figure9-4.jpg)

Bước 1: Thêm seed URL vào URL Frontier

Bước 2: HTML Downloader lấy danh sách URL từ URL Frontier.

Bước 3: HTML Downloader lấy IP của URL từ DNS Resolver và bắt đầu tải xuống.

Bước 4: Content Parser parse trang HTML và kiểm tra xem trang có format sai hay không.

Bước 5: Sau khi nội dung được parse và validate, nó được chuyển đến component “Content Seen?”.

Bước 6: Component “Content Seen” kiểm tra xem trang HTML đã có trong storage hay chưa.

* Nếu đã có trong storage, điều đó có nghĩa là cùng nội dung ở một URL khác đã được xử lý. Trong trường hợp này, trang HTML sẽ bị loại bỏ.
* Nếu chưa có trong storage, hệ thống chưa từng xử lý nội dung giống vậy. Nội dung được chuyển đến URL Extractor.

Bước 7: URL Extractor trích xuất URL từ trang HTML.

Bước 8: Các URL được trích xuất được chuyển đến URL Filter.

Bước 9: Sau khi được filter, URL được chuyển đến component “URL Seen?”.

Bước 10: Component “URL Seen” kiểm tra xem URL đã có trong storage chưa; nếu có, URL đã được xử lý trước đó và không cần làm gì thêm.

Bước 11: Nếu URL chưa từng được xử lý, nó được thêm vào URL Frontier.

### Bước 3: Thiết kế chi tiết

Đến đây, chúng ta đã thảo luận về thiết kế cấp cao. Tiếp theo, chúng ta sẽ đi sâu vào các component và kỹ thuật quan trọng nhất:

* Depth-first search (DFS) và breadth-first search (BFS)
* URL Frontier
* HTML Downloader
* Tính robust (Robustness)
* Tính mở rộng (Extensibility)
* Phát hiện và tránh nội dung có vấn đề

#### DFS và BFS

Bạn có thể hình dung web như một directed graph, trong đó các trang web là node và hyperlink (URL) là edge. Quá trình crawling có thể được xem là việc duyệt directed graph từ một trang web đến các trang khác. Hai thuật toán duyệt graph phổ biến là DFS và BFS. Tuy nhiên, DFS thường không phải lựa chọn tốt vì độ sâu của DFS có thể rất lớn.

BFS thường được web crawler sử dụng và được triển khai bằng queue first-in-first-out (FIFO). Trong FIFO queue, URL được dequeue theo thứ tự chúng được enqueue. Tuy nhiên, cách triển khai này có hai vấn đề:

1.  Phần lớn các liên kết từ cùng một trang web đều trỏ về cùng một host. Trong Hình 9-5, tất cả liên kết trên [wikipedia.com](http://wikipedia.com/) đều là internal link, khiến crawler bận xử lý các URL từ cùng một host ([wikipedia.com](http://wikipedia.com/)). Khi crawler cố gắng tải các trang web song song, server Wikipedia sẽ bị ngập trong request. Điều này được xem là “không lịch sự”.

    ![](../images/chapter9/figure9-5.jpg)
2. BFS tiêu chuẩn không xét đến độ ưu tiên của URL. Web rất lớn, và không phải trang nào cũng có chất lượng và tầm quan trọng như nhau. Vì vậy, chúng ta có thể muốn xác định độ ưu tiên của URL dựa trên page rank, traffic web, tần suất cập nhật, v.v.

#### URL Frontier

URL Frontier giúp giải quyết những vấn đề này. URL Frontier là một data structure lưu các URL cần tải xuống. URL Frontier là component quan trọng để đảm bảo tính lịch sự, độ ưu tiên của URL và freshness. Một số bài nghiên cứu đáng chú ý về URL Frontier được đề cập trong tài liệu tham khảo \[5] \[9]. Những kết quả từ các nghiên cứu này như sau:

*   Tính lịch sự

    Nhìn chung, web crawler nên tránh gửi quá nhiều request đến cùng một host server trong khoảng thời gian ngắn. Gửi quá nhiều request sẽ bị xem là “không lịch sự”, thậm chí có thể bị xem là một cuộc tấn công từ chối dịch vụ (DOS). Ví dụ, nếu không có giới hạn nào, crawler có thể gửi hàng nghìn request mỗi giây đến cùng một website. Điều này sẽ khiến web server quá tải.

    Ý tưởng chung để áp dụng tính lịch sự là mỗi lần chỉ tải một trang từ cùng một host. Có thể thêm delay giữa hai download task. Ràng buộc về tính lịch sự được triển khai bằng cách duy trì mapping từ hostname của website đến các download (work) thread. Mỗi download thread có một FIFO queue riêng và chỉ tải các URL lấy từ queue đó. Hình 9-6 minh họa thiết kế quản lý tính lịch sự.

    ![](../images/chapter9/figure9-6.jpg)

    * Queue router: đảm bảo mỗi queue (b1, b2, ... bn) chỉ chứa các URL từ cùng một host.
    *   Mapping table: ánh xạ mỗi host tới một queue

        ![](../images/chapter9/table9-1.jpg)
    * FIFO queue b1, b2 đến bn: mỗi queue chứa các URL từ cùng một host.
    * Queue selector: mỗi worker thread được ánh xạ tới một FIFO queue và chỉ tải URL từ queue đó. Logic chọn queue do Queue selector thực hiện.
    * Worker thread 1 đến N: một worker thread lần lượt tải các trang web từ cùng một host; có thể thêm delay giữa hai download task.
*   Độ ưu tiên

    Một bài đăng ngẫu nhiên trên forum thảo luận về sản phẩm Apple có trọng số rất khác so với một bài đăng trên homepage của Apple. Dù cả hai đều có keyword “Apple”, crawler nên crawl homepage của Apple trước.

    Chúng ta sắp xếp độ ưu tiên của URL dựa trên tính hữu ích, có thể đo bằng PageRank \[10], traffic của website, tần suất cập nhật, v.v. “Prioritizer” là component xử lý độ ưu tiên của URL. Để tìm hiểu sâu hơn về khái niệm này, hãy tham khảo tài liệu \[5] \[10].

    Hình 9-7 minh họa thiết kế quản lý độ ưu tiên của URL.

    ![](../images/chapter9/figure9-7.jpg)

    * Prioritizer: nhận URL làm input và tính toán độ ưu tiên.
    * Queue f1 đến fn: mỗi queue được gán một độ ưu tiên. Queue có độ ưu tiên cao sẽ có xác suất được chọn lớn hơn.
    * Queue selector: chọn ngẫu nhiên một queue, nhưng thiên về các queue có độ ưu tiên cao hơn.

    Hình 9-8 minh họa thiết kế URL Frontier, gồm hai module:

    * Queue frontend: quản lý độ ưu tiên
    * Queue backend: quản lý tính lịch sự

    ![](../images/chapter9/figure9-8.jpg)
*   Freshness

    Các trang web liên tục được thêm, xóa và chỉnh sửa. Web crawler phải crawl lại các trang đã tải theo định kỳ để giữ dataset luôn mới. Crawl lại tất cả URL vừa tốn thời gian vừa tốn tài nguyên. Dưới đây là một số chiến lược tối ưu freshness:

    * Crawl lại dựa trên lịch sử cập nhật của trang web.
    * Sắp xếp độ ưu tiên cho URL, crawl lại các trang quan trọng thường xuyên và ưu tiên hơn.
*   Lưu trữ URL Frontier

    Trong hoạt động crawling thực tế của search engine, số lượng URL trong Frontier có thể lên tới hàng trăm triệu \[4]. Lưu tất cả nội dung trong memory vừa không bền vững vừa không scale được. Lưu tất cả nội dung trên disk là điều không nên làm vì disk chậm và dễ trở thành bottleneck của quá trình crawling. Chúng ta sử dụng một phương pháp hybrid. Phần lớn URL được lưu trên disk, nên storage space không phải vấn đề. Để giảm chi phí đọc từ disk và ghi xuống disk, chúng ta duy trì các buffer trong memory cho thao tác enqueue/dequeue. Dữ liệu trong buffer được ghi xuống disk theo định kỳ.

#### HTML Downloader

HTML Downloader sử dụng giao thức HTTP để tải các trang web từ Internet. Trước khi thảo luận về HTML Downloader, hãy cùng xem xét Robots Exclusion Protocol.

**Robots.txt**

Robots.txt, còn được gọi là Robots Exclusion Protocol, là một tiêu chuẩn để website giao tiếp với crawler. Nó quy định crawler được phép tải những trang nào. Trước khi cố gắng crawl một website, crawler trước tiên nên kiểm tra robots.txt tương ứng và tuân thủ các quy tắc trong đó. Để tránh tải robots.txt lặp lại, chúng ta cache kết quả của file này. File được tải xuống định kỳ và lưu vào cache. Dưới đây là một đoạn trích từ file robots.txt lấy từ https://www.amazon.com/robots.txt. Một số directory như creatorhub không được phép để Googlebot truy cập.

```http
User-agent: Googlebot
Disallow: /creatorhub/*
Disallow: /rss/people/*/reviews
Disallow: /gp/pdp/rss/*/reviews
Disallow: /gp/cdp/member-reviews/
Disallow: /gp/aw/cr/
```

Ngoài robots.txt, tối ưu hiệu năng là một khái niệm quan trọng khác mà chúng ta sẽ trình bày cho HTML Downloader.

**Tối ưu hiệu năng**

Dưới đây là danh sách các cách tối ưu hiệu năng cho HTML Downloader.

1.  Crawling phân tán

    Để đạt hiệu năng cao, công việc crawling được phân bổ cho nhiều server, mỗi server chạy nhiều thread. Không gian URL được chia thành các phần nhỏ hơn; do đó, mỗi downloader phụ trách một subset URL. Hình 9-9 minh họa một ví dụ về crawling phân tán.

    ![](../images/chapter9/figure9-9.jpg)
2.  Cache DNS Resolver

    DNS Resolver là một bottleneck của crawler vì DNS request có thể mất thời gian do nhiều DNS interface hoạt động đồng bộ. Thời gian phản hồi DNS dao động từ 10ms đến 200ms. Khi một crawler thread gửi request đến DNS, các thread khác sẽ bị block cho đến khi request đầu tiên hoàn tất. Duy trì DNS cache để tránh gọi DNS thường xuyên là một kỹ thuật tối ưu tốc độ hiệu quả. DNS cache của chúng ta lưu mapping từ domain đến địa chỉ IP và được cập nhật định kỳ bằng cron job.
3.  Vị trí

    Phân bố các crawl server theo địa lý. Khi crawl server ở gần host của website hơn, crawler sẽ có thời gian tải xuống nhanh hơn. Thiết kế theo vị trí phù hợp với hầu hết component của hệ thống: crawl server, cache, queue, storage, v.v.
4.  Timeout ngắn

    Một số web server phản hồi chậm hoặc hoàn toàn không phản hồi. Để tránh phải chờ quá lâu, chúng ta đặt thời gian chờ tối đa. Nếu một host không phản hồi trong khoảng thời gian định trước, crawler sẽ dừng công việc và chuyển sang crawl một số trang web khác.

#### Tính robust

Ngoài tối ưu hiệu năng, tính robust cũng là một yếu tố quan trọng cần cân nhắc. Chúng ta đề xuất một số cách để cải thiện tính robust của hệ thống.

* Consistent hashing: giúp phân bổ load giữa các downloader. Có thể sử dụng consistent hashing để thêm hoặc xóa crawl server mới. Để biết chi tiết, hãy tham khảo Chương 5: Thiết kế consistent hashing.
* Lưu trạng thái và dữ liệu crawling: Để phòng ngừa failure, trạng thái và dữ liệu crawling được ghi vào storage system. Quá trình crawling bị gián đoạn có thể dễ dàng khởi động lại bằng cách load trạng thái và dữ liệu đã lưu.
* Xử lý exception: Lỗi là điều không thể tránh khỏi và thường xuyên xảy ra trong các hệ thống lớn. Crawler phải xử lý exception một cách graceful mà không làm crash hệ thống.
* Data validation: Đây là một biện pháp quan trọng để ngăn hệ thống xảy ra lỗi.

#### Tính mở rộng (Extensibility)

Gần như mọi hệ thống đều không ngừng phát triển; một trong các mục tiêu thiết kế là làm cho hệ thống đủ linh hoạt để hỗ trợ các loại nội dung mới. Crawler có thể được mở rộng bằng cách cắm thêm module mới. Hình 9-10 minh họa cách thêm module mới.

![](../images/chapter9/figure9-10.jpg)

* Module PNG Downloader là một plugin dùng để tải file PNG.
* Module web monitoring được thêm vào để giám sát web và ngăn chặn hành vi vi phạm bản quyền và thương hiệu.

#### Phát hiện và tránh nội dung có vấn đề

Phần này thảo luận về việc phát hiện và ngăn chặn nội dung dư thừa, vô nghĩa hoặc có hại.

1.  Nội dung dư thừa

    Như đã đề cập, gần 30% trang web bị trùng lặp. Hash hoặc checksum giúp phát hiện nội dung trùng lặp \[11].
2.  Bẫy spider của search engine

    Bẫy spider của search engine là các trang web khiến crawler rơi vào vòng lặp vô hạn. Ví dụ, một cấu trúc directory có độ sâu vô hạn như sau: `http://www.spidertrapexample.com/foo/bar/foo/bar/foo/bar/...` Có thể tránh những bẫy spider như vậy bằng cách đặt độ dài tối đa cho URL. Tuy nhiên, không tồn tại giải pháp chung nào để phát hiện bẫy spider. Các website chứa bẫy spider rất dễ nhận biết vì số lượng trang web phát hiện được trên những website này cao bất thường. Việc phát triển thuật toán tự động để tránh bẫy spider rất khó; tuy nhiên, người dùng có thể tự kiểm tra và nhận diện bẫy spider, sau đó loại các website đó khỏi crawler hoặc áp dụng một số URL Filter tùy chỉnh.
3.  Dữ liệu rác

    Một số nội dung có rất ít hoặc không có giá trị, chẳng hạn như quảng cáo, code snippet, URL spam, v.v. Những nội dung này không hữu ích cho crawler và nên được loại bỏ tối đa.

### Bước 4: Tóm tắt

Trong chương này, trước tiên chúng ta thảo luận về các đặc điểm của một crawler tốt: khả năng scale, tính lịch sự, tính mở rộng và tính robust. Sau đó, chúng ta đề xuất thiết kế và thảo luận về các component quan trọng. Xây dựng một web crawler có khả năng scale không phải nhiệm vụ đơn giản vì web rất lớn và đầy cạm bẫy. Dù đã đề cập đến tất cả các chủ đề, chúng ta vẫn bỏ sót nhiều điểm thảo luận liên quan:

* Server-side rendering: Nhiều website sử dụng JavaScript, AJAX và các script khác để tạo liên kết ngay trong thời gian thực. Nếu tải xuống và parse trực tiếp trang web, chúng ta sẽ không lấy được các liên kết được tạo động. Để giải quyết vấn đề này, trước khi parse trang web, chúng ta render nó ở phía server (còn gọi là dynamic rendering) \[12].
* Filter các trang không cần thiết: Với storage capacity và crawling resource có hạn, anti-spam component giúp filter các trang chất lượng thấp và trang spam \[13] \[14].
* Database replication và sharding: Các kỹ thuật như replication và sharding được sử dụng để cải thiện availability, scalability và reliability của data layer.
* Scale theo chiều ngang: Crawling quy mô lớn cần hàng trăm, thậm chí hàng nghìn server để thực hiện download task. Điều quan trọng là giữ cho các server stateless.
* Availability, consistency và reliability. Đây là những khái niệm cốt lõi cho sự thành công của mọi hệ thống lớn. Chúng ta đã thảo luận chi tiết về các khái niệm này trong Chương 1. Hãy ôn lại những gì bạn nhớ về các chủ đề này.
* Analytics: Thu thập và phân tích dữ liệu là một phần quan trọng của mọi hệ thống, vì dữ liệu là yếu tố then chốt để tinh chỉnh hệ thống.

Chúc mừng bạn đã đi đến đây! Hãy tự động viên bản thân một chút, làm tốt lắm!

### Tài liệu tham khảo

* \[1] Thư viện Quốc hội Hoa Kỳ: [https://www.loc.gov/websites/](https://www.loc.gov/websites/)
* \[2] EU Web Archive: [http://data.europa.eu/webarchive](http://data.europa.eu/webarchive)
* \[3] Digimarc: [https://www.digimarc.com/products/digimarc-services/piracy-intelligence](https://www.digimarc.com/products/digimarc-services/piracy-intelligence)
* \[4] Heydon A., Najork M. Mercator: A scalable, extensible web crawler World Wide Web, 2 (4) (1999), pp. 219-229
* \[5] By Christopher Olston, Marc Najork: Web Crawling. [http://infolab.stanford.edu/\~olston/publications/crawling\_survey.pdf](http://infolab.stanford.edu/\~olston/publications/crawling\_survey.pdf)
* \[6] 29% Of Sites Face Duplicate Content Issues: [https://tinyurl.com/y6tmh55y](https://tinyurl.com/y6tmh55y)
* \[7] Rabin M.O., et al. Fingerprinting by random polynomials Center for Research in Computing Techn., Aiken Computation Laboratory, Univ. (1981)
* \[8] B. H. Bloom, “Space/time trade-offs in hash coding with allowable errors,” Communications of the ACM, vol. 13, no. 7, pp. 422–426, 1970.
* \[9] Donald J. Patterson, Web Crawling: [https://www.ics.uci.edu/\~lopes/teaching/cs221W12/slides/Lecture05.pdf](https://www.ics.uci.edu/\~lopes/teaching/cs221W12/slides/Lecture05.pdf)
* \[10] L. Page, S. Brin, R. Motwani, and T. Winograd, “The PageRank citation ranking: Bringing order to the web,” Technical Report, Stanford University, 1998.
* \[11] Burton Bloom. Space/time trade-offs in hash coding with allowable errors. Communications of the ACM, 13(7), pages 422--426, July 1970.
* \[12] Google Dynamic Rendering: [https://developers.google.com/search/docs/guides/dynamic-rendering](https://developers.google.com/search/docs/guides/dynamic-rendering)
* \[13] T. Urvoy, T. Lavergne, and P. Filoche, “Tracking web spam with hidden style similarity,” in Proceedings of the 2nd International Workshop on Adversarial Information Retrieval on the Web, 2006.
* \[14] H.-T. Lee, D. Leonard, X. Wang, and D. Loguinov, “IRLbot: Scaling to 6 billion pages and beyond,” in Proceedings of the 17th International World Wide Web Conference, 2008.
