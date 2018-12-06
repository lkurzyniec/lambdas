using System;
using System.Threading.Tasks;
using Amazon;
using Amazon.Lambda.Core;
using Amazon.SimpleNotificationService;
using Amazon.SimpleNotificationService.Model;
using Newtonsoft.Json;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.Json.JsonSerializer))]

namespace HappyCode
{
    public class PublishToSns
    {
        public async Task FunctionHandler(IotButtonPayload @event, ILambdaContext context)
        {
            context.Logger.LogLine($"Received event: {JsonConvert.SerializeObject(@event)}");

            var publishRequest = new PublishRequest
            {
                TopicArn = TOPIC_ARN,
                Subject = "Greetings from IoT Button",
                Message = $"Pressed: {@event.ClickType}",
            };

            string topicArn = Environment.GetEnvironmentVariable("TopicArn");
            context.Logger.LogLine($"TopicArn: {topicArn.Substring(0, 30)}...");
            string accessKey = Environment.GetEnvironmentVariable("AccessKey");
            context.Logger.LogLine($"AccessKey: {accessKey.Substring(0, 5)}...");
            string secretKey = Environment.GetEnvironmentVariable("SecretKey");
            context.Logger.LogLine($"SecretKey: {secretKey.Substring(0, 5)}...");

            var client = new AmazonSimpleNotificationServiceClient(accessKey, secretKey, RegionEndpoint.EUWest1);
            await client.PublishAsync(publishRequest).ConfigureAwait(false);

            context.Logger.LogLine("Event published successfully");
        }
    }

    public class IotButtonPayload
    {
        public string SerialNumber { get; set; }
        public string BatteryVoltage { get; set; }
        public string ClickType { get; set; }
    }
}
