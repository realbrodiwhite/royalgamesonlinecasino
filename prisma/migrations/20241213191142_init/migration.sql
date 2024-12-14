-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "dateOfBirth" DATETIME NOT NULL,
    "password" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "balance" INTEGER NOT NULL DEFAULT 0,
    "emailSubscriber" BOOLEAN NOT NULL DEFAULT false,
    "textSubscriber" BOOLEAN NOT NULL DEFAULT false,
    "deviceNotifications" BOOLEAN NOT NULL DEFAULT false,
    "totalTimePlayed" INTEGER NOT NULL DEFAULT 0,
    "totalCreditsWon" INTEGER NOT NULL DEFAULT 0,
    "biggestWin" INTEGER NOT NULL DEFAULT 0,
    "lastBigWin" INTEGER NOT NULL DEFAULT 0,
    "lastBigWinDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "winLossDollars" REAL NOT NULL DEFAULT 0.0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLogin" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
