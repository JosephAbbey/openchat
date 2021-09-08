-- AlterTable
ALTER TABLE `Message` MODIFY `data` LONGBLOB NOT NULL;

-- RenameIndex
ALTER TABLE `Account` RENAME INDEX `Account.providerId_providerAccountId_unique` TO `Account_providerId_providerAccountId_key`;

-- RenameIndex
ALTER TABLE `Session` RENAME INDEX `Session.accessToken_unique` TO `Session_accessToken_key`;

-- RenameIndex
ALTER TABLE `Session` RENAME INDEX `Session.sessionToken_unique` TO `Session_sessionToken_key`;

-- RenameIndex
ALTER TABLE `User` RENAME INDEX `User.email_unique` TO `User_email_key`;

-- RenameIndex
ALTER TABLE `VerificationRequest` RENAME INDEX `VerificationRequest.identifier_token_unique` TO `VerificationRequest_identifier_token_key`;

-- RenameIndex
ALTER TABLE `VerificationRequest` RENAME INDEX `VerificationRequest.token_unique` TO `VerificationRequest_token_key`;
