using Microsoft.EntityFrameworkCore;
using PgManager.Entities;

namespace PgManager.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Room> Rooms { get; set; }
        public DbSet<Tenant> Tenants { get; set; }
        public DbSet<User> Users { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Room Configuration
            modelBuilder.Entity<Room>(entity =>
            {
                entity.HasIndex(e => e.RoomNumber).IsUnique();

                entity.Property(r => r.SharingType)
                    .HasConversion<int>();
            });

            // Tenant Configuration
            modelBuilder.Entity<Tenant>(entity =>
            {
                entity.HasIndex(e => e.Name);
                entity.HasIndex(e => e.PhoneNumber);
                entity.HasIndex(e => e.RoomId);
                entity.HasIndex(e => e.IsActive);
                entity.HasIndex(e => e.LastPaidDate);

                entity.HasOne(t => t.Room)
                    .WithMany(r => r.Tenants)
                    .HasForeignKey(t => t.RoomId)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.Property(t => t.SharingType)
                    .HasConversion<int>();
            });

            // User Configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasIndex(u => u.PhoneNumber).IsUnique();
            });
        }
    }
}