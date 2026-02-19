-- Fix Room Number Unique Constraint
-- This script changes the unique constraint from RoomNumber alone
-- to a composite constraint on (UserId, RoomNumber)
-- This allows different PG owners to use the same room numbers

-- Drop the old unique index on RoomNumber
DROP INDEX IF EXISTS `IX_Rooms_RoomNumber` ON `Rooms`;

-- Create new composite unique index on UserId and RoomNumber
CREATE UNIQUE INDEX `IX_Rooms_UserId_RoomNumber` ON `Rooms` (`UserId`, `RoomNumber`);
