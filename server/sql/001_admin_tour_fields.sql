-- Run once against the existing TravelWithMe database before starting the updated API.
USE TravelWithMe;
GO

IF COL_LENGTH('dbo.tours', 'overview_description') IS NULL
BEGIN
    ALTER TABLE dbo.tours
    ADD overview_description NVARCHAR(MAX) NULL;
END;
GO

IF COL_LENGTH('dbo.tours', 'tour_type') IS NULL
BEGIN
    ALTER TABLE dbo.tours
    ADD tour_type VARCHAR(30) NOT NULL
        CONSTRAINT df_tours_tour_type DEFAULT 'RESORT';
END;
GO

IF COL_LENGTH('dbo.tours', 'is_featured') IS NULL
BEGIN
    ALTER TABLE dbo.tours
    ADD is_featured BIT NOT NULL
        CONSTRAINT df_tours_is_featured DEFAULT 0;
END;
GO

DECLARE @schedule_prices_added BIT = 0;

IF COL_LENGTH('dbo.tour_schedules', 'adult_price') IS NULL
BEGIN
    ALTER TABLE dbo.tour_schedules
    ADD adult_price DECIMAL(18,2) NOT NULL
        CONSTRAINT df_tour_schedules_adult_price DEFAULT 0;
    SET @schedule_prices_added = 1;
END;

IF COL_LENGTH('dbo.tour_schedules', 'child_price') IS NULL
BEGIN
    ALTER TABLE dbo.tour_schedules
    ADD child_price DECIMAL(18,2) NOT NULL
        CONSTRAINT df_tour_schedules_child_price DEFAULT 0;
    SET @schedule_prices_added = 1;
END;

IF COL_LENGTH('dbo.tour_schedules', 'infant_price') IS NULL
BEGIN
    ALTER TABLE dbo.tour_schedules
    ADD infant_price DECIMAL(18,2) NOT NULL
        CONSTRAINT df_tour_schedules_infant_price DEFAULT 0;
    SET @schedule_prices_added = 1;
END;

IF @schedule_prices_added = 1
BEGIN
    EXEC sys.sp_executesql N'
        UPDATE s
        SET s.adult_price = t.adult_price,
            s.child_price = t.child_price,
            s.infant_price = t.infant_price
        FROM dbo.tour_schedules s
        INNER JOIN dbo.tours t ON t.tour_id = s.tour_id;
    ';
END;

IF COL_LENGTH('dbo.tour_itineraries', 'activities') IS NULL
BEGIN
    ALTER TABLE dbo.tour_itineraries
    ADD activities NVARCHAR(MAX) NULL;
END;
GO

IF COL_LENGTH('dbo.tour_itineraries', 'hotel') IS NULL
BEGIN
    ALTER TABLE dbo.tour_itineraries
    ADD hotel NVARCHAR(200) NULL;
END;
GO
