IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Donations' AND xtype='U')
BEGIN
    CREATE TABLE Donations (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        StreamerId VARCHAR(50) NOT NULL,
        SenderName NVARCHAR(100) NOT NULL,
        Message NVARCHAR(500),
        Amount DECIMAL(18,2) NOT NULL,
        PaymentRef VARCHAR(100) NOT NULL UNIQUE,
        Status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
        CreatedAt DATETIME DEFAULT GETDATE()
    );
END
GO

IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='StreamerSettings' AND xtype='U')
BEGIN
    CREATE TABLE StreamerSettings (
        StreamerId VARCHAR(50) PRIMARY KEY,
        PromptPayId VARCHAR(50) NOT NULL,
        MinDonationAmount DECIMAL(18,2) DEFAULT 10.00
    );
END
GO

CREATE OR ALTER PROCEDURE sp_CreateDonation
    @StreamerId VARCHAR(50),
    @SenderName NVARCHAR(100),
    @Message NVARCHAR(500),
    @Amount DECIMAL(18,2),
    @PaymentRef VARCHAR(100)
AS
BEGIN
    INSERT INTO Donations (StreamerId, SenderName, Message, Amount, PaymentRef, Status)
    VALUES (@StreamerId, @SenderName, @Message, @Amount, @PaymentRef, 'PENDING');
    
    SELECT 'SUCCESS' AS ResultStatus;
END
GO

CREATE OR ALTER PROCEDURE sp_UpdateDonationStatus
    @PaymentRef VARCHAR(100),
    @NewStatus VARCHAR(20)
AS
BEGIN
    DECLARE @OldStatus VARCHAR(20);
    DECLARE @StreamerId VARCHAR(50);
    DECLARE @SenderName NVARCHAR(100);
    DECLARE @Message NVARCHAR(500);
    DECLARE @Amount DECIMAL(18,2);
    
    SELECT @OldStatus = Status, @StreamerId = StreamerId, @SenderName = SenderName, @Message = Message, @Amount = Amount
    FROM Donations WHERE PaymentRef = @PaymentRef;
    
    IF @OldStatus = 'PENDING' AND @NewStatus = 'SUCCESS'
    BEGIN
        UPDATE Donations SET Status = @NewStatus WHERE PaymentRef = @PaymentRef;
        SELECT 'SUCCESS' AS ResultStatus, @StreamerId AS StreamerId, @SenderName AS SenderName, @Message AS Message, @Amount AS Amount;
    END
    ELSE
    BEGIN
        SELECT 'IGNORED' AS ResultStatus;
    END
END
GO

CREATE OR ALTER PROCEDURE sp_GetStreamerPaymentInfo
    @StreamerId VARCHAR(50)
AS
BEGIN
    SELECT PromptPayId, MinDonationAmount FROM StreamerSettings WHERE StreamerId = @StreamerId;
END
GO

-- Insert mock data for streamer "zbingz"
IF NOT EXISTS (SELECT * FROM StreamerSettings WHERE StreamerId = 'zbingz')
BEGIN
    INSERT INTO StreamerSettings (StreamerId, PromptPayId, MinDonationAmount)
    VALUES ('zbingz', '0812345678', 10.00);
END
GO
