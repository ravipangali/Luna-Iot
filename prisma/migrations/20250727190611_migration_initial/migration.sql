-- CreateTable
CREATE TABLE `devices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `imei` CHAR(15) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `sim` ENUM('NTC', 'Ncell') NOT NULL,
    `protocol` ENUM('GT06', 'FMB003') NOT NULL DEFAULT 'GT06',
    `iccid` VARCHAR(255) NOT NULL,
    `model` ENUM('EC08', 'VL149') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `devices_imei_key`(`imei`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vehicles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `imei` CHAR(15) NOT NULL,
    `device_id` INTEGER NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `vehicle_no` VARCHAR(255) NOT NULL,
    `vehicle_type` ENUM('Ambulance', 'Bike', 'Boat', 'Bulldozer', 'Bus', 'Car', 'Crane', 'Cycle', 'Dumper', 'Garbage', 'Jcb', 'Jeep', 'Mixer', 'Mpv', 'Pickup', 'SchoolBus', 'Suv', 'Tanker', 'Tempo', 'Tractor', 'Train', 'Truck', 'Van') NOT NULL DEFAULT 'Car',
    `odometer` DECIMAL(10, 2) NOT NULL,
    `mileage` DECIMAL(10, 2) NOT NULL,
    `minimum_fuel` DECIMAL(10, 2) NOT NULL,
    `speed_limit` INTEGER NOT NULL DEFAULT 60,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `vehicles_imei_key`(`imei`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `locations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `device_id` INTEGER NOT NULL,
    `imei` CHAR(15) NOT NULL,
    `latitude` DECIMAL(10, 8) NOT NULL,
    `longitude` DECIMAL(11, 8) NOT NULL,
    `speed` INTEGER NOT NULL,
    `course` INTEGER NOT NULL,
    `real_time_gps` BOOLEAN NOT NULL,
    `satellite` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `locations_device_id_idx`(`device_id`),
    INDEX `locations_created_at_idx`(`created_at`),
    INDEX `locations_latitude_longitude_idx`(`latitude`, `longitude`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `statuses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `device_id` INTEGER NOT NULL,
    `imei` CHAR(15) NOT NULL,
    `battery` INTEGER NOT NULL,
    `signal` INTEGER NOT NULL,
    `ignition` BOOLEAN NOT NULL,
    `charging` BOOLEAN NOT NULL,
    `relay` BOOLEAN NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `statuses_device_id_idx`(`device_id`),
    INDEX `statuses_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `vehicles` ADD CONSTRAINT `vehicles_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `locations` ADD CONSTRAINT `locations_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `statuses` ADD CONSTRAINT `statuses_device_id_fkey` FOREIGN KEY (`device_id`) REFERENCES `devices`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
