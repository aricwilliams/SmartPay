using SmartPay.Domain.Common;

namespace SmartPay.Domain.ValueObjects;

public class Location : ValueObject
{
    public double Latitude { get; }
    public double Longitude { get; }
    public string Address { get; }

    public Location(double latitude, double longitude, string address)
    {
        if (latitude < -90 || latitude > 90)
            throw new ArgumentException("Latitude must be between -90 and 90", nameof(latitude));
            
        if (longitude < -180 || longitude > 180)
            throw new ArgumentException("Longitude must be between -180 and 180", nameof(longitude));
            
        if (string.IsNullOrWhiteSpace(address))
            throw new ArgumentException("Address cannot be null or empty", nameof(address));

        Latitude = latitude;
        Longitude = longitude;
        Address = address;
    }

    public double DistanceTo(Location other)
    {
        // Haversine formula for calculating distance between two points
        const double earthRadius = 6371; // km
        
        var dLat = ToRadians(other.Latitude - Latitude);
        var dLon = ToRadians(other.Longitude - Longitude);
        
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(ToRadians(Latitude)) * Math.Cos(ToRadians(other.Latitude)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
                
        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        
        return earthRadius * c;
    }

    private static double ToRadians(double angle) => angle * Math.PI / 180;

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Latitude;
        yield return Longitude;
        yield return Address;
    }

    public override string ToString() => $"{Address} ({Latitude:F6}, {Longitude:F6})";
}