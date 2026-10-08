# Chương 01: Từ 0 đến hàng triệu người dùng


Thiết kế một hệ thống phục vụ hàng triệu người dùng là một thử thách và là quá trình liên tục hoàn thiện, cải tiến. Trong chương này, chúng ta sẽ xây dựng một hệ thống phục vụ một người dùng, rồi từng bước mở rộng để phục vụ hàng triệu người dùng. Sau khi đọc xong chương này, bạn sẽ nắm được một số kỹ thuật hữu ích để giải quyết các câu hỏi phỏng vấn system design.

### Thiết lập máy chủ đơn

Hành trình vạn dặm bắt đầu từ một bước chân, và việc xây dựng một hệ thống phức tạp cũng vậy. Để bắt đầu từ điều đơn giản, chúng ta chạy mọi thứ trên một máy chủ duy nhất. Hình 1-1 minh họa thiết lập máy chủ đơn, trong đó mọi thành phần đều chạy trên cùng một máy chủ: ứng dụng Web, database, cache, v.v.

![](images/chapter1/figure1.jpg)

Để hiểu thiết lập này, việc xem xét luồng request và nguồn traffic sẽ rất hữu ích. Trước hết, hãy xem luồng request (Hình 1-2).

![](images/chapter1/figure2.jpg)

1. Người dùng truy cập website thông qua domain, chẳng hạn api.mysite.com. Thông thường, Domain Name System (DNS) là một dịch vụ trả phí do bên thứ ba cung cấp, thay vì được host trên server của chúng ta.
2. Địa chỉ Internet Protocol (IP) được trả về cho browser hoặc mobile application. Trong ví dụ này, địa chỉ IP trả về là 15.125.23.214.
3. Sau khi có địa chỉ IP, một request Hypertext Transfer Protocol (HTTP)\[1] được gửi trực tiếp đến Web server của bạn.
4. Web server trả về trang HTML để render hoặc response JSON.

Tiếp theo, hãy xem xét nguồn traffic. Traffic đến Web server của bạn đến từ hai nguồn: Web application và mobile application.

* Web application: sử dụng một nhóm ngôn ngữ phía server (Java, Python, v.v.) để xử lý business logic, lưu trữ, v.v., cùng các ngôn ngữ phía client (HTML và JavaScript) để render.
* Mobile application: HTTP là giao thức giao tiếp giữa mobile application và Web server. Vì đơn giản, JavaScript Object Notation (JSON) thường được dùng làm format response API để truyền dữ liệu. Dưới đây là một ví dụ response API ở định dạng JSON:

      ```
      GET /users/12 – Retrieve user object for id = 12
      {
         "id": 12,
         "firstName": "John",
         "lastName": "Smith",
         "address": {
            "streetAddress": "21 2nd Street",
            "city": "New York",
            "state": "NY",
            "postalCode":10021
         },		

         "phoneNumbers": [
            "212 555-1234",
            "646 555-4567"
        ]
      }
      ```

### Database

Khi lượng người dùng tăng lên, một server duy nhất không còn đủ nữa, vì vậy chúng ta cần nhiều server: một server xử lý traffic Web/mobile và một server khác dành cho database (Hình 1-3). Tách server xử lý traffic Web/mobile (Web layer) và server database (data layer) cho phép chúng mở rộng độc lập.

![](images/chapter1/figure3.jpg)

*   **Nên dùng database nào?**

    Bạn có thể chọn giữa database quan hệ và database phi quan hệ. Hãy xem sự khác biệt giữa chúng.

    Database quan hệ còn được gọi là relational database management system (RDBMS) hoặc SQL database. Một số database phổ biến nhất gồm MySQL, Oracle Database, PostgreSQL, v.v. Database quan hệ dùng table và row để biểu diễn và lưu trữ dữ liệu. Bạn có thể dùng SQL để thực hiện các thao tác join giữa những table database khác nhau.

    Database phi quan hệ còn được gọi là NoSQL database. Một số database phổ biến gồm CouchDB, Neo4j, Cassandra, HBase, Amazon DynamoDB, v.v.\[2] Các database này được chia thành bốn loại: key-value store, graph store, column store và document store. Database phi quan hệ thường không hỗ trợ thao tác join.

    Với hầu hết developer, database quan hệ là lựa chọn tốt nhất vì chúng đã tồn tại hơn 40 năm và luôn hoạt động tốt trong thực tế. Tuy nhiên, nếu database quan hệ không phù hợp với use case cụ thể của bạn, việc khám phá các lựa chọn vượt ra ngoài database quan hệ là rất quan trọng.

    Database phi quan hệ có thể là lựa chọn phù hợp trong các trường hợp sau:

    * Ứng dụng của bạn cần latency cực thấp
    * Dữ liệu của bạn phi cấu trúc hoặc bạn không có dữ liệu quan hệ nào.
    * Bạn chỉ cần serialize và deserialize dữ liệu (JSON, XML, YAML, v.v.).
    * Bạn cần lưu trữ một lượng dữ liệu lớn

#### Vertical scaling và horizontal scaling

Vertical scaling, còn gọi là scale up, là việc tăng hiệu năng bằng cách bổ sung năng lực tính toán (CPU, RAM, v.v.) cho một server duy nhất.

Horizontal scaling, còn gọi là scale out, cho phép mở rộng bằng cách thêm nhiều server hơn vào resource pool.

Khi traffic thấp, vertical scaling là một lựa chọn tốt, và ưu điểm chính của vertical scaling là sự đơn giản. Đáng tiếc là nó cũng có một số hạn chế nghiêm trọng.

* Vertical scaling có giới hạn cứng: không thể bổ sung CPU và memory vô hạn cho một server duy nhất
* Vertical scaling không có failover và redundancy. Nếu một server gặp sự cố, website và application sẽ ngừng hoạt động hoàn toàn.

Do những hạn chế của vertical scaling, horizontal scaling phù hợp hơn với các ứng dụng quy mô lớn.

Trong thiết kế trước đây, người dùng kết nối trực tiếp đến Web server. Nếu server ngừng hoạt động, người dùng sẽ không thể truy cập website. Trong trường hợp khác, nếu nhiều người dùng cùng truy cập Web server và server đạt đến giới hạn, người dùng thường gặp response chậm hoặc không thể kết nối đến server.

Load balancing là giải pháp tốt nhất cho những vấn đề này.

### Load balancing

Load balancer phân phối đều traffic đến các Web server được định nghĩa trong load balancer pool. Hình 1-4 minh họa cách load balancer hoạt động.

![](images/chapter1/figure4.jpg)

Như Hình 1-4 cho thấy, người dùng kết nối trực tiếp đến public IP của load balancer. Với cấu hình này, client không còn truy cập trực tiếp vào Web server. Để tăng tính bảo mật, việc giao tiếp giữa các server sử dụng private IP. Private IP là địa chỉ IP chỉ có thể truy cập giữa các server trong cùng một network. Địa chỉ này không thể truy cập từ Internet. Load balancer giao tiếp với Web server thông qua private IP.

Trong Hình 1-4, sau khi thêm một load balancer và Web server thứ hai, chúng ta đã giải quyết thành công vấn đề failover và cải thiện availability của Web layer.

Chi tiết như sau:

* Nếu server 1 ngừng hoạt động, toàn bộ traffic sẽ được route đến server 2. Điều này ngăn website bị down; chúng ta cũng sẽ thêm một Web server mới đang healthy vào server pool để cân bằng tải.
* Nếu traffic website tăng nhanh và hai server không đủ để xử lý traffic, load balancer có thể xử lý tốt vấn đề này. Bạn chỉ cần thêm server vào Web server pool, load balancer sẽ tự động gửi request đến các server đó.

Web layer hiện đã ổn, vậy còn data layer thì sao? Thiết kế hiện tại chỉ có một database, nên không hỗ trợ failover và redundancy. Database replication là một kỹ thuật phổ biến để giải quyết các vấn đề này. Hãy cùng xem xét.

### Database replication

Trích từ Wikipedia: “Database replication có thể áp dụng cho nhiều database management system, thường thiết lập mối quan hệ master/slave giữa database gốc (master) và các database bản sao (slave)”.

Master database thường chỉ hỗ trợ thao tác write. Slave database replicate dữ liệu từ master database và chỉ hỗ trợ thao tác read. Mọi lệnh thay đổi dữ liệu, chẳng hạn insert, delete, update, đều phải được gửi đến master database.

Hầu hết application có yêu cầu về tỷ lệ read/write cao, vì vậy số lượng slave trong hệ thống thường nhiều hơn số lượng master.

Hình 1-5 minh họa một master database và nhiều slave database.

![](images/chapter1/figure5.jpg)

Các lợi ích của database replication gồm:

* Hiệu năng tốt hơn: trong mô hình master/slave này, mọi thao tác write và update đều diễn ra trên master, còn mọi thao tác read được phân phối cho các slave. Mô hình này cải thiện hiệu năng vì cho phép xử lý song song nhiều query hơn.
* Độ tin cậy: nếu một database của bạn bị phá hủy bởi bão, động đất hoặc thảm họa tự nhiên khác, dữ liệu vẫn được giữ lại. Bạn không cần lo mất dữ liệu vì dữ liệu đã được replicate ở nhiều nơi.
* High availability: bằng cách replicate dữ liệu ở các vị trí khác nhau, website vẫn có thể hoạt động ngay cả khi một database offline, vì bạn có thể truy cập dữ liệu được lưu trên một database server khác.

Ở phần trước, chúng ta đã thảo luận cách load balancer giúp cải thiện availability của hệ thống. Ở đây, chúng ta đặt ra câu hỏi tương tự: nếu một database offline thì sao? Thiết kế kiến trúc được thảo luận trong Hình 1-5 có thể xử lý trường hợp này:

* Nếu chỉ có một slave database khả dụng và nó offline, các thao tác read sẽ tạm thời được chuyển đến master database. Khi phát hiện vấn đề, một slave mới sẽ thay thế slave cũ. Nếu có nhiều slave database khả dụng, các thao tác read sẽ được chuyển đến những slave khác đang healthy.
* Nếu master database offline, một slave sẽ được promote thành master mới và mọi thao tác database sẽ tạm thời được thực hiện trên master mới. Một slave mới sẽ ngay lập tức thay thế slave cũ để tiếp tục replication dữ liệu. Trong hệ thống production, việc promote master database mới phức tạp hơn vì dữ liệu trên slave có thể chưa được cập nhật mới nhất; dữ liệu bị mất cần được cập nhật bằng cách chạy data recovery script. Mặc dù một số phương pháp replication khác như multi-master replication và circular replication có thể hữu ích, việc cấu hình chúng phức tạp hơn. Thảo luận này nằm ngoài phạm vi của cuốn sách; độc giả quan tâm có thể tham khảo các tài liệu được liệt kê trong phần tài liệu tham khảo\[4]\[5].

Hình 1-6 minh họa thiết kế hệ thống sau khi thêm load balancer và database replication.

![](images/chapter1/figure6.jpg)

Hãy xem xét thiết kế này:

* Người dùng lấy IP của load balancer từ DNS
* Người dùng dùng IP này để kết nối đến load balancer
* HTTP request được route đến Server 1 hoặc Server 2.
* Web server đọc dữ liệu người dùng từ slave database
* Web server route mọi thao tác thay đổi dữ liệu đến master database, bao gồm write, update và delete.

Đến đây, bạn đã hiểu khá sâu về Web layer và database layer. Đã đến lúc cải thiện load/response time. Có thể thực hiện việc này bằng cách thêm cache layer và chuyển nội dung tĩnh (JavaScript/CSS/image/video) sang content delivery network (CDN).

### Cache

Cache là một vùng lưu trữ tạm thời, dùng để lưu các kết quả response tốn kém hoặc dữ liệu được truy cập thường xuyên trong memory, nhờ đó các request sau có thể được xử lý nhanh hơn. Như Hình 1-6 cho thấy, mỗi khi một web page mới được load, một hoặc nhiều database call được thực hiện để lấy dữ liệu. Việc liên tục gọi database ảnh hưởng đáng kể đến hiệu năng của application. Cache có thể giảm nhẹ vấn đề này.

#### Cache layer

Cache layer là một data storage layer tạm thời, nhanh hơn database. Những lợi ích của việc có cache layer độc lập gồm hiệu năng hệ thống tốt hơn, giảm tải cho database và khả năng scale cache layer độc lập. Hình 1-7 minh họa một thiết lập cache server có thể có:

![](images/chapter1/figure7.jpg)

Sau khi nhận request, Web server trước tiên kiểm tra xem cache có response khả dụng hay không. Nếu có, server gửi dữ liệu về client. Nếu không, server query database, lưu kết quả response vào cache rồi gửi response về client. Chiến lược cache này được gọi là read-through cache. Tùy vào loại dữ liệu, kích thước và access pattern, còn có những chiến lược cache khác. Một nghiên cứu trước đây giải thích cách các chiến lược cache khác nhau hoạt động\[6].

Việc tương tác với cache server khá đơn giản vì hầu hết cache server đều cung cấp API cho các ngôn ngữ lập trình phổ biến. Đoạn code dưới đây cho thấy một Memcached API điển hình:

![](images/chapter1/figure7-8.jpg)

#### Những điều cần lưu ý khi sử dụng cache

Dưới đây là một số điều cần lưu ý khi sử dụng cache system:

* Quyết định khi nào nên dùng cache: hãy cân nhắc dùng cache khi dữ liệu được đọc thường xuyên nhưng không thường xuyên thay đổi. Vì dữ liệu cache được lưu trong volatile memory, cache server không phù hợp để lưu trữ lâu dài. Ví dụ, nếu cache server khởi động lại, mọi dữ liệu trong memory sẽ bị mất, vì vậy dữ liệu quan trọng nên được lưu trong persistent data store.
* Chính sách expiration: triển khai expiration policy là một thói quen tốt. Khi dữ liệu cache hết hạn, dữ liệu sẽ bị xóa khỏi cache. Nếu không có expiration policy, dữ liệu cache sẽ được giữ vĩnh viễn trong memory. Không nên đặt thời gian hết hạn quá ngắn vì điều này khiến hệ thống phải load lại dữ liệu từ database quá thường xuyên. Đồng thời, cũng không nên đặt thời gian hết hạn quá dài vì dữ liệu có thể trở nên stale.
* Consistency: điều này liên quan đến việc giữ cho data store và cache đồng bộ. Vấn đề consistency có thể xảy ra vì thao tác thay đổi data store và cache không nằm trong cùng một transaction. Khi scale trên nhiều region, việc duy trì consistency giữa data store và cache là một thử thách. Để biết thêm thông tin, hãy xem bài viết “Scaling Memcache at Facebook” do Facebook công bố\[7].
*   Giảm thiểu sự cố: một cache server duy nhất là một single point of failure (SPOF) tiềm ẩn, được Wikipedia định nghĩa như sau: “Single point of failure (SPOF) là một phần của hệ thống mà nếu gặp sự cố sẽ khiến toàn bộ hệ thống ngừng hoạt động.”\[8] Vì vậy, nên sử dụng nhiều cache server ở các data center khác nhau để tránh single point of failure (SPOF). Một phương pháp được khuyến nghị khác là cấu hình lượng memory cao hơn một tỷ lệ phần trăm nhất định so với kích thước cần thiết. Điều này tạo ra một vùng đệm khi mức sử dụng memory tăng lên.

    ![](images/chapter1/figure8.jpg)
* Chính sách eviction: khi cache đầy, mọi request cố gắng thêm nội dung vào cache có thể khiến các item hiện có bị loại bỏ; việc này được gọi là cache eviction. Least Recently Used (LRU) là cache eviction policy phổ biến nhất. Có thể sử dụng các eviction policy khác, chẳng hạn Least Frequently Used (LFU) hoặc First In First Out (FIFO), để đáp ứng các use case khác nhau.

### CDN

CDN (content delivery network) là một network gồm các server phân bố về mặt địa lý, dùng để phân phối nội dung tĩnh. CDN server cache nội dung tĩnh như image, video, file CSS, JavaScript, v.v.

Dynamic content caching là một khái niệm tương đối mới và nằm ngoài phạm vi của cuốn sách. Khái niệm này hỗ trợ cache HTML page dựa trên request path, query string, Cookie và request header. Để biết thêm thông tin, hãy xem bài viết được đề cập trong tài liệu tham khảo\[9]. Cuốn sách này tập trung vào cách dùng CDN để cache nội dung tĩnh.

Ở mức khái quát, CDN hoạt động như sau: khi người dùng truy cập website, CDN server gần người dùng nhất sẽ phân phối nội dung tĩnh. Trực quan mà nói, người dùng càng xa CDN server thì website load càng chậm. Ví dụ, nếu CDN server đặt tại San Francisco, người dùng ở Los Angeles sẽ lấy nội dung nhanh hơn người dùng ở châu Âu. Hình 1-9 là một ví dụ rõ ràng cho thấy CDN rút ngắn thời gian load như thế nào.

![](images/chapter1/figure9.jpg)

Hình 1-10 minh họa workflow của CDN

![](images/chapter1/figure10.jpg)

1. User A cố gắng lấy image.png thông qua image URL. Domain của URL này do CDN provider cung cấp. Dưới đây là hai image URL dùng để minh họa URL trên Amazon và Akamai CDN:
   * https://mysite.cloudfront.net/logo.jpg
   * https://mysite.akamai.com/image-manager/img/logo.jpg
2. Nếu CDN server không có image.png trong cache, CDN server sẽ request file từ origin (có thể là Web server hoặc online storage như Amazon S3).
3. Origin trả image.png về CDN server cùng với HTTP header Time-to-Live (TTL) tùy chọn, cho biết image được cache trong bao lâu.
4. CDN cache image và trả image về cho User A. Image tiếp tục được cache trong CDN cho đến khi TTL hết hạn.
5. User B gửi request để lấy cùng image đó
6. Miễn là TTL chưa hết hạn, image sẽ được trả về từ cache.

#### Những yếu tố cần cân nhắc khi sử dụng CDN

* Chi phí: CDN do provider bên thứ ba vận hành và bạn phải trả phí cho data transfer đi vào và đi ra khỏi CDN. Với các cache resource ít được sử dụng, CDN không đem lại lợi ích đáng kể, vì vậy bạn nên cân nhắc đưa chúng ra khỏi CDN.
* Đặt thời gian cache expiration phù hợp: với nội dung nhạy cảm về thời gian, việc đặt cache expiration time rất quan trọng. Cache expiration time không nên quá dài cũng không nên quá ngắn. Nếu quá dài, nội dung có thể không còn mới; nếu quá ngắn, nội dung có thể liên tục phải được load lại từ origin server vào CDN.
* CDN origin pull: bạn nên cân nhắc website/application xử lý CDN failure như thế nào. Nếu CDN tạm thời gián đoạn, client cần có khả năng phát hiện vấn đề và request resource từ origin.
* Invalidate file: trước khi cache hết hạn, bạn có thể xóa file khỏi CDN bằng một trong các cách sau:
  * Dùng API do CDN provider cung cấp để invalidate CDN object
  * Dùng object versioning để cung cấp các phiên bản object khác nhau. Versioning object cho phép thêm tham số, chẳng hạn version number, vào URL. Ví dụ: thêm version number 2 vào query string: image.png?v=2.

Thiết kế sau khi thêm CDN và cache được thể hiện trong Hình 1-11.

![](images/chapter1/figure11.jpg)

1. Web server không còn phục vụ static asset (JS, CSS, image, v.v.); các asset này được lấy từ CDN để có hiệu năng tốt hơn.
2. Việc cache dữ liệu giúp giảm tải cho database.

### Web layer stateless

Đã đến lúc cân nhắc horizontal scaling cho Web layer. Để làm vậy, chúng ta cần đưa state (chẳng hạn user session data) ra khỏi Web layer. Một cách làm tốt là lưu session data trong persistent storage, chẳng hạn relational database hoặc NoSQL. Mỗi Web server trong cluster đều có thể truy cập state data từ database; đây được gọi là Web layer stateless.

#### Stateful architecture

Stateful service và stateless service có một số khác biệt quan trọng. Stateful server ghi nhớ dữ liệu (state) của client từ request này sang request tiếp theo. Stateless service không lưu giữ bất kỳ state information nào.

Hình 1-12 minh họa một ví dụ về stateful architecture.

![](images/chapter1/figure12.jpg)

Trong Hình 1-12, session data và avatar data của User A được lưu trên Server 1. Để authenticate User A, HTTP request phải được route đến Server 1. Nếu request được gửi đến server khác, chẳng hạn Server 2, authentication sẽ thất bại vì Server 2 không chứa session data của User A. Tương tự, mọi HTTP request của User B đều phải được route đến Server 2, còn mọi request của User C phải được gửi đến Server 3.

Vấn đề là mỗi request từ cùng một client phải được route đến cùng một server. Hầu hết load balancer hỗ trợ sticky session (sticky sessions) để thực hiện việc này\[10]; tuy nhiên, cách này tạo thêm overhead, khiến việc thêm hoặc xóa server khó hơn, và việc xử lý server failure cũng là một thử thách.

#### Stateless architecture

Stateless architecture được minh họa trong Hình 1-13.

![](images/chapter1/figure13.jpg)

Trong stateless architecture này, HTTP request từ người dùng có thể được gửi đến bất kỳ Web server nào và lấy state data từ shared data store. State data được lưu trong shared data store, không lưu trên Web server. Một stateless system đơn giản hơn, robust hơn và dễ scale hơn.

Hình 1-14 minh họa thiết kế được cập nhật với stateless Web layer.

![](images/chapter1/figure14.jpg)

Trong Hình 1-14, chúng ta đưa session data ra khỏi Web layer và lưu trong persistent data store. Shared data store có thể là relational database, Memcached/Redis, NoSQL, v.v. NoSQL data store được chọn vì dễ scale. Auto scaling có nghĩa là tự động thêm hoặc xóa Web server tùy theo traffic load. Sau khi đưa state data ra khỏi Web server, có thể thêm hoặc xóa server tùy theo traffic load, nhờ đó dễ dàng thực hiện auto scaling cho Web layer.

Website của bạn phát triển nhanh chóng và thu hút nhiều người dùng quốc tế. Để cải thiện availability và mang lại user experience tốt hơn trên phạm vi địa lý rộng hơn, việc hỗ trợ nhiều data center là rất quan trọng.

### Data center

Hình 1-15 minh họa một thiết lập mẫu với hai data center. Trong điều kiện hoạt động bình thường, người dùng được geoDNS route (còn gọi là geographic routing) đến data center gần nhất. Traffic ở miền Đông Hoa Kỳ là x%, còn traffic ở miền Tây Hoa Kỳ là (100-x)%. geoDNS là một DNS service cho phép phân giải domain thành IP address dựa trên vị trí của người dùng.

![](images/chapter1/figure15.jpg)

Trong trường hợp xảy ra sự cố nghiêm trọng tại một data center, chúng ta sẽ chuyển toàn bộ traffic đến một data center healthy. Trong Hình 1-16, data center 2 (miền Tây Hoa Kỳ) offline và 100% traffic được route đến data center 1 (miền Đông Hoa Kỳ).

![](images/chapter1/figure16.jpg)

Để triển khai cấu hình multi-data-center, cần giải quyết một số thách thức kỹ thuật:

* Traffic redirection: cần có công cụ hiệu quả để redirect traffic đến đúng data center. geoDNS có thể route traffic đến data center gần người dùng nhất dựa trên vị trí người dùng.
* Data synchronization: người dùng ở các region khác nhau có thể sử dụng local database hoặc cache khác nhau. Khi failover, traffic có thể được route đến data center không khả dụng. Một chiến lược phổ biến là replicate dữ liệu trên nhiều data center. Nghiên cứu trước đây trình bày cách Netflix triển khai asynchronous multi-data-center replication\[11]
*   Testing và deployment: với thiết lập multi-data-center, việc test website/application tại các vị trí khác nhau là rất quan trọng. Công cụ automated deployment đóng vai trò thiết yếu trong việc duy trì tính nhất quán của service giữa tất cả data center \[11].

Để tiếp tục scale hệ thống, chúng ta cần decouple các component khác nhau để chúng có thể scale độc lập. Message queue là một chiến lược quan trọng được nhiều distributed system thực tế sử dụng để giải quyết vấn đề này.

### Message queue

Message queue là một component persistent được lưu trong memory, hỗ trợ giao tiếp bất đồng bộ, đóng vai trò buffer và phân phối các asynchronous request. Kiến trúc cơ bản của message queue rất đơn giản: input service, được gọi là producer/publisher, tạo message rồi gửi chúng vào message queue. Các service hoặc server khác, được gọi là consumer/subscriber, kết nối đến queue và thực hiện action được message định nghĩa.

Mô hình này được minh họa trong Hình 1-17.

![](images/chapter1/figure17.jpg)

Decoupling khiến message queue trở thành kiến trúc được ưa chuộng để xây dựng application scalable và reliable. Với message queue, producer có thể publish message vào queue khi consumer không thể xử lý message. Ngay cả khi producer không khả dụng, consumer vẫn có thể lấy dữ liệu từ queue.

Hãy xem xét use case sau: application của bạn hỗ trợ tùy chỉnh photo, bao gồm crop, sharpen, blur, v.v. Các customization task này cần một khoảng thời gian để hoàn thành. Trong Hình 1-18, Web server publish photo processing job vào message queue. Photo processing worker lấy job từ message queue và thực hiện các customization task bất đồng bộ. Producer và consumer có thể scale độc lập. Khi kích thước queue trở nên lớn, hãy thêm worker để giảm thời gian xử lý. Tuy nhiên, nếu queue hầu hết thời gian đều rỗng, có thể giảm số lượng worker.

![](images/chapter1/figure18.jpg)

### Logging, metrics, automation

Khi xử lý một website nhỏ chạy trên một vài server, logging, metrics và automation là những lựa chọn tốt nhưng không bắt buộc. Tuy nhiên, khi website đã phát triển thành một business lớn, đầu tư vào các công cụ này là điều thiết yếu.

Logging: việc monitor error log rất quan trọng vì giúp xác định lỗi và vấn đề trong hệ thống. Bạn có thể monitor error log ở cấp từng server hoặc dùng công cụ để aggregate chúng vào một centralized service nhằm dễ search và xem hơn.

Metrics: thu thập nhiều loại metric khác nhau giúp chúng ta có được business insight và hiểu tình trạng health của hệ thống. Một số metric hữu ích gồm:

* Metric cấp host: CPU, memory, disk I/O, v.v.
* Metric cấp aggregate: chẳng hạn hiệu năng của toàn bộ database layer và cache layer
* Metric business quan trọng: daily active user, retention, revenue, v.v.

Automation: khi hệ thống trở nên lớn và phức tạp, chúng ta cần xây dựng hoặc sử dụng các công cụ automation để nâng cao productivity. Continuous integration là một practice tốt, trong đó mỗi lần code commit đều được validation tự động, giúp team kịp thời phát hiện vấn đề. Ngoài ra, việc automation build, test, deployment process, v.v. có thể cải thiện đáng kể productivity của developer.

#### Thêm message queue và các công cụ khác

Hình 1-19 minh họa thiết kế được cập nhật. Do giới hạn về dung lượng, hình chỉ hiển thị một data center.

1. Thiết kế này có một message queue, giúp hệ thống loosely coupled hơn và có khả năng recovery sau failure tốt hơn.
2. Logging, monitoring, metrics và automation tool cũng được đưa vào.

![](images/chapter1/figure19.jpg)

Khi dữ liệu tăng lên mỗi ngày, database load ngày càng nặng. Đã đến lúc scale data layer.

### Database scaling

Có hai phương pháp database scaling phổ biến: vertical scaling và horizontal scaling.

#### Vertical scaling

Vertical scaling, còn gọi là scale up, là việc scale bằng cách bổ sung thêm resource (như CPU, memory, disk, v.v.) cho machine hiện có.

Có những database server rất mạnh. Theo Amazon Relational Database Service (RDS)\[12], bạn có thể có một database server với 24TB memory. Database server mạnh như vậy có thể lưu trữ và xử lý một lượng dữ liệu lớn. Ví dụ, vào năm 2013, stackoverflow.com có hơn 10 triệu monthly unique visitor nhưng chỉ có 1 master database\[13].

Tuy nhiên, vertical scaling cũng có một số nhược điểm nghiêm trọng:

* Bạn có thể bổ sung thêm CPU, memory, v.v. cho server, nhưng phần cứng có giới hạn. Nếu có một user base khổng lồ, một server là không đủ.
* Rủi ro single point of failure cao hơn
* Tổng chi phí của vertical scaling cao hơn; server mạnh đắt hơn nhiều.

#### Horizontal scaling

Horizontal scaling, còn gọi là sharding, là việc thêm nhiều server hơn. Hình 1-20 so sánh vertical scaling và horizontal scaling.

![](images/chapter1/figure20.jpg)

Sharding chia một database lớn thành các phần nhỏ hơn, dễ quản lý hơn, được gọi là shard. Mỗi shard dùng cùng một schema, dù dữ liệu thực tế trên mỗi shard là duy nhất đối với shard đó.

Hình 1-21 minh họa một ví dụ về sharded database. User data được phân bổ đến database server dựa trên user ID. Mỗi khi truy cập dữ liệu, một hash function được dùng để tìm shard tương ứng. Trong ví dụ của chúng ta, user\_id % 4 được dùng làm hash function. Nếu kết quả là 0, shard 0 sẽ được dùng để lưu trữ và lấy dữ liệu. Nếu kết quả là 1, shard 1 sẽ được dùng. Các shard khác áp dụng logic tương tự.

![](images/chapter1/figure21.jpg)

Hình 1-22 hiển thị user table trong sharded database.

![](images/chapter1/figure22.jpg)

Việc chọn shard key là một yếu tố quan trọng cần cân nhắc khi triển khai sharding strategy. Shard key (còn gọi là partition key) gồm một hoặc nhiều column, quyết định cách dữ liệu được phân phối. Như Hình 1-22 cho thấy, “user\_id” là shard key. Shard key cho phép route database query đến đúng database để retrieve và modify dữ liệu hiệu quả. Khi chọn shard key, metric quan trọng nhất là chọn một key có thể phân phối dữ liệu đồng đều.

Sharding là một kỹ thuật tuyệt vời để scale database, nhưng hoàn toàn không phải giải pháp hoàn hảo. Nó đưa complexity và những thách thức mới vào hệ thống:

* Resharding data: cần reshard dữ liệu trong các trường hợp sau:
  1. Do tăng trưởng nhanh, một shard không còn có thể chứa thêm dữ liệu
  2. Do dữ liệu được phân phối không đồng đều, một số shard có thể cạn kiệt nhanh hơn các shard khác. Khi shard cạn kiệt, cần update sharding function và di chuyển dữ liệu. Consistent hashing, sẽ được thảo luận trong Chương 5, là một kỹ thuật phổ biến để giải quyết vấn đề này.
* Celebrity problem: còn được gọi là hot key problem. Việc truy cập quá mức vào một shard cụ thể có thể khiến server quá tải. Hãy tưởng tượng dữ liệu của Katy Perry, Justin Bieber và Lady Gaga cuối cùng đều nằm trên cùng một shard. Với một social application, shard này sẽ bị ngập trong các thao tác read. Để giải quyết vấn đề này, có thể cần phân bổ một shard cho mỗi celebrity, và mỗi shard thậm chí có thể cần được partition thêm.
* Join và denormalization: một khi database được shard trên nhiều service, rất khó thực hiện join giữa các database shard. Một giải pháp phổ biến là denormalize database để có thể query trong một table duy nhất.

Trong Hình 1-23, chúng ta shard database để hỗ trợ traffic dữ liệu tăng nhanh. Đồng thời, một số functionality phi quan hệ được chuyển sang NoSQL data store để giảm tải cho database. Đây là một bài viết giới thiệu nhiều use case của NoSQL\[14].

![](images/chapter1/figure23.jpg)

### Hàng triệu người dùng trở lên

Scale hệ thống là một quá trình liên tục lặp lại. Việc lặp lại những kiến thức đã học trong chương này có thể giúp chúng ta tiến xa hơn. Để vượt qua mốc một triệu người dùng, cần thêm nhiều tinh chỉnh và chiến lược mới. Ví dụ, bạn có thể cần optimize hệ thống và decouple hệ thống thành các service nhỏ hơn. Những kiến thức trong chương này cung cấp nền tảng tốt để đối phó với các thách thức mới. Ở cuối chương, chúng ta tóm tắt cách scale hệ thống để hỗ trợ hàng triệu người dùng:

* Giữ Web layer stateless
* Xây dựng redundancy ở mọi layer
* Cache dữ liệu bất cứ khi nào có thể
* Hỗ trợ nhiều data center
* Host static data trên CDN
* Scale data layer bằng sharding
* Tách các layer thành các service riêng biệt
* Monitor hệ thống và sử dụng automation tool

Chúc mừng bạn đã đi đến đây! Hãy tự động viên bản thân một chút, bạn đã làm rất tốt!

### Tài liệu tham khảo

\[1] Hypertext Transfer Protocol: [https://en.wikipedia.org/wiki/Hypertext\_Transfer\_Protocol](https://en.wikipedia.org/wiki/Hypertext\_Transfer\_Protocol)

\[2] Should you go Beyond Relational Databases?: [https://blog.teamtreehouse.com/should-you-go-beyond-relational-databases](https://blog.teamtreehouse.com/should-you-go-beyond-relational-databases)

\[3] Replication: [https://en.wikipedia.org/wiki/Replication\_(computing)](https://en.wikipedia.org/wiki/Replication\_\(computing\))

\[4] Multi-master replication: [https://en.wikipedia.org/wiki/Multi-master\_replication](https://en.wikipedia.org/wiki/Multi-master\_replication)

\[5] NDB Cluster Replication: Multi-Master and Circular Replication: [https://dev.mysql.com/doc/refman/5.7/en/mysql-cluster-replication-multi-master.html](https://dev.mysql.com/doc/refman/5.7/en/mysql-cluster-replication-multi-master.html)

\[6] Caching Strategies and How to Choose the Right One: [https://codeahoy.com/2017/08/11/caching-strategies-and-how-to-choose-the-right-one/](https://codeahoy.com/2017/08/11/caching-strategies-and-how-to-choose-the-right-one/)

\[7] R. Nishtala, "Facebook, Scaling Memcache at," 10th USENIX Symposium on Networked Systems Design and Implementation (NSDI ’13).

\[8] Single point of failure: [https://en.wikipedia.org/wiki/Single\_point\_of\_failure](https://en.wikipedia.org/wiki/Single\_point\_of\_failure)

\[9] Amazon CloudFront Dynamic Content Delivery: [https://aws.amazon.com/cloudfront/dynamic-content/](https://aws.amazon.com/cloudfront/dynamic-content/)

\[10] Configure Sticky Sessions for Your Classic Load Balancer: [https://docs.aws.amazon.com/elasticloadbalancing/latest/classic/elb-sticky-sessions.html](https://docs.aws.amazon.com/elasticloadbalancing/latest/classic/elb-sticky-sessions.html)

\[11] Active-Active for Multi-Regional Resiliency: [https://netflixtechblog.com/active-active-for-multi-regional-resiliency-c47719f6685b](https://netflixtechblog.com/active-active-for-multi-regional-resiliency-c47719f6685b)

\[12] Amazon EC2 High Memory Instances: [https://aws.amazon.com/ec2/instance-types/high-memory/](https://aws.amazon.com/ec2/instance-types/high-memory/)

\[13] What it takes to run Stack Overflow: [http://nickcraver.com/blog/2013/11/22/what-it-takes-to-run-stack-overflow](http://nickcraver.com/blog/2013/11/22/what-it-takes-to-run-stack-overflow)

\[14] What The Heck Are You Actually Using NoSQL For: [http://highscalability.com/blog/2010/12/6/what-the-heck-are-you-actually-using-nosql-for](http://highscalability.com/blog/2010/12/6/what-the-heck-are-you-actually-using-nosql-for.html)
