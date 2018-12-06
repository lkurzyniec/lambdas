using System;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

using Amazon.Lambda.Core;
using Newtonsoft.Json;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.Json.JsonSerializer))]

namespace HappyCode
{
    public class PostToIfttt
    {
        public async Task<HttpStatusCode> FunctionHandler(IotButtonPayload @event, ILambdaContext context)
        {
            context.Logger.LogLine($"Received event: {JsonConvert.SerializeObject(@event)}");

            var dataToPost = new
            {
                value1 = "Hello IoT world",
                value2 = $"Greetings from IFTTT Maker triggered by {@event.SerialNumber} IoT Button",
                value3 = @event.ClickType,
            };
            string json = JsonConvert.SerializeObject(dataToPost);

            string makerEvent = Environment.GetEnvironmentVariable("MakerEvent");
            context.Logger.LogLine($"MakerEvent: {makerEvent}");
            string makerKey = Environment.GetEnvironmentVariable("MakerKey");
            context.Logger.LogLine($"MakerKey: {makerKey.Substring(0, 5)}...");

            var postUrl = new Uri($"https://maker.ifttt.com/trigger/{makerEvent}/with/key/{makerKey}");
            var client = new HttpClient();
            var response = await client.PostAsync(postUrl, new StringContent(json, Encoding.UTF8, "application/json"))
                .ConfigureAwait(false);
            context.Logger.LogLine($"STATUS CODE: {response.StatusCode}");
            
            var responseContent = await response.Content.ReadAsStringAsync().ConfigureAwait(false);
            context.Logger.LogLine($"Data received: {responseContent}");

            return response.StatusCode;
        }
    }

    public class IotButtonPayload
    {
        public string SerialNumber { get; set; }
        public string BatteryVoltage { get; set; }
        public string ClickType { get; set; }
    }
}
