using System;
using System.IO;
using System.Net;
using System.Net.Http;
using System.Net.Mail;
using System.Net.Security;
using System.Security.Cryptography.X509Certificates;
using System.Threading.Tasks;

using Amazon.Lambda.Core;
using Newtonsoft.Json;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.Json.JsonSerializer))]

namespace HappyCode
{
    public class WeatherOnMail
    {
        private readonly HttpClient _httpClient = new HttpClient();

        public async Task FunctionHandler(IotButtonPayload @event, ILambdaContext context)
        {
            context.Logger.LogLine($"Received event: {JsonConvert.SerializeObject(@event)}");
            
            string weatherUrl = Environment.GetEnvironmentVariable("WeatherUrl");
            context.Logger.LogLine($"WeatherUrl: {weatherUrl}");
            var weatherData = await GetWeatherAsync(weatherUrl).ConfigureAwait(false);
            context.Logger.LogLine("Weather captured successfully");
            
            using (var smtpClient = new SmtpClient())
            {
                var configuration = GetConfiguration();
                context.Logger.LogLine($"SMTP configuration: Host:{configuration.Host}, Port:{configuration.Port}, " +
                    $"EmailTo:{configuration.EmailTo}, EmailFrom:{configuration.EmailFrom}, Login:{configuration.Login}");

                smtpClient.Host = configuration.Host;
                smtpClient.Port = configuration.Port ?? 0;
                smtpClient.EnableSsl = true;
                smtpClient.UseDefaultCredentials = false;
                smtpClient.Credentials = new NetworkCredential(configuration.Login, configuration.Password);

                var mailMessage = new MailMessage
                {
                    Subject = "Weather from IoT Button",
                    Body = $"Weather attached.<br><br>Button: <b>{@event.SerialNumber}</b><br>Clicked: <b>{@event.ClickType}</b>",
                    IsBodyHtml = true
                };

                mailMessage.From = new MailAddress(configuration.EmailFrom, "IoT Button");
                mailMessage.To.Add(configuration.EmailTo);
                mailMessage.Attachments.Add(new Attachment(weatherData, "weather.png", "image/png"));

                context.Logger.LogLine("All set, going to send mail");
                await smtpClient.SendMailAsync(mailMessage).ConfigureAwait(false);
                context.Logger.LogLine("Email sent successfully");
            }
        }

        private async Task<Stream> GetWeatherAsync(string weatherUrl)
        {
            var response = await _httpClient.GetAsync(weatherUrl).ConfigureAwait(false);
            if (!response.IsSuccessStatusCode)
            {
                throw new Exception("Failed to capture weather");
            }

            return await response.Content.ReadAsStreamAsync().ConfigureAwait(false);
        }

        private SendEmailConfiguration GetConfiguration()
        {
            var configuration = new SendEmailConfiguration
            {
                EmailTo = Environment.GetEnvironmentVariable("EmailTo"),
                EmailFrom = Environment.GetEnvironmentVariable("EmailFrom"),
                Host = Environment.GetEnvironmentVariable("SmtpHost"),
                Login = Environment.GetEnvironmentVariable("Login"),
                Password = Environment.GetEnvironmentVariable("Password"),
            };

            string smtpPort = Environment.GetEnvironmentVariable("SmtpPort");
            if (int.TryParse(smtpPort, out int port))
            {
                configuration.Port = port;
            }

            return configuration;
        }

        private struct SendEmailConfiguration
        {
            public string Host { get; set; }
            public int? Port { get; set; }
            public string Login { get; set; }
            public string Password { get; set; }
            public string EmailFrom { get; set; }
            public string EmailTo { get; set; }
        }
    }

    public class IotButtonPayload
    {
        public string SerialNumber { get; set; }
        public string BatteryVoltage { get; set; }
        public string ClickType { get; set; }
    }
}
