class Balances {
    constructor() {
        this.budgetAmount = document.getElementById("budget-amount");
        this.expenses = document.getElementById("expenses-amount");
        this.balance = document.getElementById("balance-amount");
    }
    
    updateBudgetAmount(budget, expense) {
        this.budgetAmount.innerHTML = budget;
        localStorage.setItem('budget', budget);
        this.expenses.innerHTML = expense;
        this.balance.innerHTML = budget - expense;
    }
    
    updateExpenseBalance(expense) {
        this.expenses.innerHTML = expense;
        const budget = +this.budgetAmount.innerHTML;
        this.balance.innerHTML = budget - expense;
    }
    
    deleteExpense(delAmount) {
        const expense = (this.expenses.innerHTML =
            +this.expenses.innerHTML.toString() - +delAmount);
        this.updateExpenseBalance(expense);
    }
}

class ExpenseItem {
    constructor(parentList) {
        this.parentList = parentList || [];
        this.updateBalances();
        this.renderExpensesItem(this.parentList);
    }
    
    updateBalances() {
        let expenseAmount = 0;
        for (const item of this.parentList) {
            expenseAmount += +item.amount;
        }
        const balObj = new Balances();
        balObj.updateExpenseBalance(expenseAmount);
    }
    
    deleteExpenseItem(eid) {
        const itemIndex = this.parentList.findIndex(item => item.id == eid);
        if (itemIndex > -1) {
            const balObj = new Balances();
            balObj.deleteExpense(this.parentList[itemIndex].amount);
            this.parentList.splice(itemIndex, 1);
            this.renderExpensesItem(this.parentList);
            this.saveExpensesToLocalStorage();
        }
    }
    
    renderExpensesItem(expenseList) {
        const expense_list = document.getElementById("expense-list");
        expense_list.innerHTML = "";
        const currencySymbol = document.getElementById("currency").value || "₹";
        
        if (expenseList && expenseList.length > 0) {
            expenseList.forEach(expense => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${expense.title}</td>
                    <td>${currencySymbol} ${expense.amount}</td>
                    <td>${expense.date}</td>
                    <td><button class="del-btn">&times;</button></td>
                `;
                row.querySelector(".del-btn").addEventListener(
                    "click",
                    () => this.deleteExpenseItem(expense.id)
                );
                expense_list.appendChild(row);
            });
        }
    }
    
    saveExpensesToLocalStorage() {
        localStorage.setItem('expenses', JSON.stringify(this.parentList));
    }
}

function exportToCSV() {
    const expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    if (expenses.length === 0) {
        alert("No expense data to export.");
        return;
    }

    const currencySymbol = document.getElementById("currency").value || "₹";
    let csvContent = "Title,Amount,Date\n";

    expenses.forEach(expense => {
        csvContent += `"${expense.title}","${currencySymbol}${expense.amount}","${expense.date}"\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "expenses.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

class App {
    static init() {
        this.initializeStorage();
        this.enterBudget();
        this.addItem();
        this.setupEventListeners();
    }

    static initializeStorage() {
        const storedBudget = localStorage.getItem('budget') || 0;
        const storedExpenses = JSON.parse(localStorage.getItem('expenses')) || [];
        const balObj = new Balances();
        
        balObj.updateBudgetAmount(storedBudget, 0);

        if (storedExpenses.length > 0) {
            new ExpenseItem(storedExpenses);
        } else {
            document.getElementById('expense-list').innerHTML = '';
            balObj.updateExpenseBalance(0);
        }
    }

    static enterBudget() {
        const addBudgetBtn = document.getElementById("add-budget-btn");
        const budgetInput = document.getElementById("budget");
        const currencySelect = document.getElementById("currency");
        const currencySymbols = document.querySelectorAll("#currency-symbol");
        
        // Check if a budget already exists
        const existingBudget = parseFloat(localStorage.getItem('budget')) || 0;
        budgetInput.value = existingBudget; // Set the input value to existing budget
        document.querySelector(".add-expense-box").classList.add("visible"); // Show expense box

        // Enable the button when a valid budget is entered
        budgetInput.addEventListener("input", () => {
            const budgetValue = budgetInput.value.trim();
            addBudgetBtn.disabled = !budgetValue || isNaN(budgetValue); // Enable or disable based on input
        });

        addBudgetBtn.addEventListener("click", () => {
            const budgetValue = parseFloat(budgetInput.value.trim());
            const currencyValue = currencySelect.value.trim();

            if (isNaN(budgetValue) || budgetValue <= 0) {
                alert("Please enter a valid budget amount greater than zero.");
                return;
            }

            if (!currencyValue) {
                alert("Please select a currency.");
                return;
            }

            // Update the existing budget without resetting expenses
            const newBudget = existingBudget + budgetValue;
            const balObj = new Balances();
            balObj.updateBudgetAmount(newBudget, +document.getElementById("expenses-amount").innerHTML); // Keep existing expenses
            localStorage.setItem('budget', newBudget); // Store the new budget
            
            currencySymbols.forEach(symbol => {
                symbol.textContent = currencyValue;
            });

            budgetInput.value = ""; // Clear the input field
            addBudgetBtn.disabled = true; // Disable the button after setting the budget
        });
    }

    static addItem() {
        const addExpenseBtn = document.getElementById("add-expense-btn");
        addExpenseBtn.addEventListener("click", () => {
            const title = document.getElementById("expense-title").value.trim();
            const amount = document.getElementById("expense-amount").value.trim();
            const date = document.getElementById("expense-date").value;
            const budgetAmount = +document.getElementById("budget-amount").textContent;
            const balance = +document.getElementById("balance-amount").textContent;

            if (!title) {
                alert("Please enter an expense title.");
                return;
            }

            if (!amount || isNaN(amount)) {
                alert("Please enter a valid amount.");
                return;
            }

            if (!date) {
                alert("Please select a date.");
                return;
            }

            if (+amount > budgetAmount) {
                alert("Expense exceeds your budget!");
                return;
            }

            if (+amount > balance) {
                alert("Not enough balance for this expense!");
                return;
            }

            const expenseList = JSON.parse(localStorage.getItem('expenses')) || [];
            const newExpense = {
                id: Date.now().toString(),
                title,
                amount,
                date
            };

            expenseList.push(newExpense);
            localStorage.setItem('expenses', JSON.stringify(expenseList));
            
            new ExpenseItem(expenseList);

            // Clear input fields
            document.getElementById("expense-title").value = "";
            document.getElementById("expense-amount").value = "";
            document.getElementById("expense-date").value = "";
        });
    }

    static setupEventListeners() {
        document.getElementById("reset-app-btn").addEventListener("click", () => {
            localStorage.removeItem('budget');
            localStorage.removeItem('expenses');
            
            document.getElementById('budget').value = '';
            document.getElementById('expense-list').innerHTML = '';
            document.querySelector(".add-expense-box").classList.remove("visible");
            document.getElementById('add-budget-btn').disabled = false;
            
            // Clear expense form fields
            document.getElementById("expense-title").value = "";
            document.getElementById("expense-amount").value = "";
            document.getElementById("expense-date").value = "";
            
            // Reset balances
            const balObj = new Balances();
            balObj.updateBudgetAmount(0, 0);
            
            alert('Application has been reset. You can start fresh with a new budget.');
        });

        document.getElementById("export-csv-btn").addEventListener("click", exportToCSV);

        document.getElementById("give-tips-btn").addEventListener("click", () => {
            const balance = +document.getElementById("balance-amount").textContent;
            if (balance >= 500) {
                window.location.href = 'tips.html';
            } else {
                alert("You need at least 500 in balance to give tips.");
            }
        });
    }
}

document.addEventListener("DOMContentLoaded", () => App.init());