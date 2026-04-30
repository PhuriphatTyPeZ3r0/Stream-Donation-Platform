-- 1. ลบตารางเดิมทิ้งก่อน (ถ้ามี) เพื่อล้าง Schema เก่า
IF OBJECT_ID('StreamerSettings', 'U') IS NOT NULL
    DROP TABLE StreamerSettings;
GO

-- 2. สร้างตารางใหม่ด้วยคอลัมน์ที่ถูกต้อง
CREATE TABLE StreamerSettings (
    StreamerId VARCHAR(50) PRIMARY KEY,
    PromptPayId VARCHAR(20) NOT NULL,
    MinDonationAmount DECIMAL(18, 2) DEFAULT 1.00,
    GoalAmount DECIMAL(18, 2) DEFAULT 0.00,
    AlertSoundUrl NVARCHAR(500),
    UpdatedAt DATETIME2 DEFAULT SYSUTCDATETIME()
);
GO

-- SP สำหรับหน้า Dashboard (Upsert)
CREATE OR ALTER PROCEDURE sp_UpsertStreamerSettings
    @StreamerId VARCHAR(50),
    @PromptPayId VARCHAR(20),
    @MinDonationAmount DECIMAL(18, 2), -- เปลี่ยนชื่อตัวแปรให้ตรงตาม Logic
    @GoalAmount DECIMAL(18, 2)
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM StreamerSettings WHERE StreamerId = @StreamerId)
    BEGIN
        UPDATE StreamerSettings
        SET PromptPayId = @PromptPayId,
            MinDonationAmount = @MinDonationAmount,
            GoalAmount = @GoalAmount,
            UpdatedAt = SYSUTCDATETIME()
        WHERE StreamerId = @StreamerId;
    END
    ELSE
    BEGIN
        INSERT INTO StreamerSettings (StreamerId, PromptPayId, MinDonationAmount, GoalAmount)
        VALUES (@StreamerId, @PromptPayId, @MinDonationAmount, @GoalAmount);
    END
END;
GO

-- SP สำหรับดึงข้อมูลไปใช้ใน Donation Service
CREATE OR ALTER PROCEDURE sp_GetStreamerPaymentInfo
    @StreamerId VARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT PromptPayId, MinDonationAmount 
    FROM StreamerSettings 
    WHERE StreamerId = @StreamerId;
END;
GO