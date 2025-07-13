# 💰 Money Splitting Features Guide

## Overview
The Free Splitwise app now includes comprehensive money splitting features that allow you to:
- Split expenses with multiple people
- Choose different splitting methods (equal, percentage, manual)
- Track who owes what
- Mark payments as completed
- View balances and outstanding payments

## How to Access

1. **Go to Groups Page**: Click on any group from your groups list
2. **Navigate to Expenses**: Click "💰 Manage Expenses" button
3. **Choose Split Tab**: The app opens on the "Split Expenses" tab by default

## Creating Split Expenses

### Step 1: Open Split Modal
- Click the "➕ Split New Expense" button
- This opens the comprehensive split expense creator

### Step 2: Enter Basic Information
- **Expense Title**: e.g., "Dinner at Italian Restaurant"
- **Date**: When the expense occurred
- **Total Amount**: The total cost to be split

### Step 3: Choose Split Type

#### 🟢 Equal Split
- **Best for**: When everyone pays the same amount
- **How it works**: Total amount ÷ number of people
- **Example**: $120 dinner split equally among 4 people = $30 each

#### 🟡 Percentage Split  
- **Best for**: When people should pay different percentages
- **How it works**: You specify what percentage each person pays
- **Example**: $100 bill where Person A pays 60%, Person B pays 40%
- **Validation**: Percentages must add up to exactly 100%

#### 🔴 Manual Split
- **Best for**: When you want to specify exact amounts
- **How it works**: You enter the exact dollar amount for each person
- **Example**: $85 bill where Person A pays $50, Person B pays $35
- **Validation**: Manual amounts must add up to the total amount

### Step 4: Select People
- **User Selection**: Check the boxes next to people you want to include in the split
- **Multiple Selection**: You can select as many people as needed
- **User Info**: Shows name and email for easy identification

### Step 5: Configure Split Details
The split details section changes based on your chosen split type:

- **Equal**: Shows calculated amount per person automatically
- **Percentage**: Input fields for each person's percentage + real-time dollar calculation
- **Manual**: Input fields for each person's exact dollar amount

### Step 6: Review & Submit
- **Validation**: The system checks that splits are mathematically correct
- **Summary**: Shows total percentages or amounts before creating
- **Error Messages**: Clear feedback if anything needs to be fixed

## Viewing Split Expenses

### Balance Summary
- **Your Balance**: Shows if you owe money (red) or are owed money (green)
- **User Info**: Displays your name and email for confirmation

### Outstanding Payments
- **Quick View**: Shows up to 3 unpaid splits with amounts
- **Total Count**: Displays total number of outstanding payments

### Expense Details
Each split expense shows:
- **Header**: Title, date, split type, and total amount
- **Split Breakdown**: Who owes how much
- **Payment Status**: Paid/Unpaid for each person
- **Settlement Status**: Overall completion status

## Managing Payments

### Mark as Paid
- **Individual Splits**: Click "Mark Paid" button next to any unpaid split
- **Status Updates**: Immediately updates to show "Paid" status
- **Balance Updates**: Your balance automatically recalculates

### Settlement Tracking
- **Progress Indicator**: Shows "X of Y splits paid"
- **Status Labels**: 
  - 🟢 "Fully Settled" = All splits paid
  - 🔴 "Pending" = Some splits still unpaid

## Simple Entries (Legacy)

- **Access**: Click the "📝 Simple Entries" tab
- **Purpose**: For basic expense tracking without splitting
- **Features**: Add, edit, delete simple expense entries

## API Integration

The features use these API endpoints:
- `POST /api/entries/with-splits` - Create split expenses
- `GET /api/users/all` - Load available users
- `GET /api/splits/my-balance` - Get your balance
- `POST /api/splits/pay` - Mark splits as paid
- `GET /api/splits/unpaid` - Get outstanding payments

## Tips for Best Results

1. **Equal Splits**: Perfect for restaurants, shared groceries, group activities
2. **Percentage Splits**: Great for rent, utilities, or when income varies
3. **Manual Splits**: Ideal for mixed purchases or specific agreements
4. **User Selection**: Make sure to select all relevant people before configuring splits
5. **Validation**: Pay attention to error messages - they help ensure accuracy
6. **Payment Tracking**: Mark payments promptly to keep balances accurate

## Troubleshooting

### Common Issues:
- **Percentages don't add to 100%**: Adjust percentages until they total exactly 100%
- **Manual amounts don't match total**: Check that individual amounts sum to the total
- **Users not loading**: Check your internet connection and try refreshing
- **Balance not updating**: Try refreshing the page after marking payments

### Error Messages:
- **"Please select at least one user"**: Choose people to split with
- **"Percentages must add up to 100%"**: Adjust percentage values
- **"Manual amounts must add up to [total]"**: Check your manual amounts

Enjoy splitting expenses fairly and easily! 🎉 