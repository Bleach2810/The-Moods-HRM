using System;

namespace TheMoods.Data.Models
{
    public class DeviceSubscription
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string UserId { get; set; } = null!;
        public string Endpoint { get; set; } = null!;
        public string P256Dh { get; set; } = null!;
        public string Auth { get; set; } = null!;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
