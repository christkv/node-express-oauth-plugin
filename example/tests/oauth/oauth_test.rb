require 'rubygems'
gem 'oauth'   

require 'oauth'
require 'webrick'

consumer = OAuth::Consumer.new("key","secret", :site => "http://localhost:3000")
request_token = consumer.get_request_token(:oauth_callback => 'http://localhost:9000/callback')
puts "= authorize_url: #{request_token.consumer.site}#{request_token.consumer.authorize_path}?oauth_token=#{request_token.params['oauth_token']}"

class Simple < WEBrick::HTTPServlet::AbstractServlet  
  def initialize(server, consumer, request_token)
    super(server)
    @consumer = consumer
    @request_token = request_token
  end
  
  def do_GET(request, response)
    status, content_type, body = do_stuff_with(request)    
    response.status = status
    response['Content-Type'] = content_type
    response.body = body
  end
  
  def do_stuff_with(request)
    puts(request.query.inspect)    
    access_token = @request_token.get_access_token(:oauth_verifier => request.query['oauth_verifier'])
    result = {:oauth_verifier => request.query['oauth_verifier'], :oauth_token => request.query['oauth_token'], :access_token => access_token.inspect}    
    
    # execute a call
    puts access_token.request(:get, "/api/geo/list").body
    
    # return result
    return 200, "text/plain", result.inspect
  end  
end

server = WEBrick::HTTPServer.new(:Port => 9000)
server.mount "/callback", Simple, consumer, request_token
['INT', 'TERM'].each { |signal|
    trap(signal) { server.shutdown }
}
server.start


# 
# gets
# 
# access_token = request_token.get_access_token()
# puts "= access_token: #{access_token.inspect}"