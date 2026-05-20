import React, { useState, useEffect } from 'react'
import Input from '../Inputs/Input';
import EmojiPickerPopup from '../EmojiPickerPopup';

const AddExpenseForm = ({ onAddExpense, initialData }) => {
  const [expense, setExpense] = useState({
    category: "",
    amount: "",
    date: "",
    icon: "",
  });

  useEffect(() => {
    if (initialData) {
      setExpense({
        category: initialData.category || "",
        amount: initialData.amount || "",
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : "",
        icon: initialData.icon || "",
      });
    }
  }, [initialData]);

  const handleChange = (key, value) =>
    setExpense({ ...expense, [key]: value });

  return (
    <div>
      <Input
        value={expense.category}
        onChange={({ target }) => handleChange("category", target.value)}
        label="Category"
        placeholder="Rent, Groceries, etc"
        type="text"
      />

      <Input
        value={expense.amount}
        onChange={({ target }) => handleChange("amount", target.value)}
        label="Amount"
        placeholder=""
        type="number"
      />

      <div className='flex justify-between items-center gap-5'>
        <Input
          className="flex-1"
          value={expense.date}
          onChange={({ target }) => handleChange("date", target.value)}
          label="Date"
          placeholder=""
          type="date"
        />
        <EmojiPickerPopup
          icon={expense.icon}
          onSelect={(selectedIcon) => handleChange("icon", selectedIcon)}
        />
      </div>

      <div className="flex justify-end mt-6">
        <button
          type="button"
          className="add-btn add-btn-fill"
          onClick={() => onAddExpense(expense)}
        >
          {initialData ? "Update Expense" : "Add Expense"}
        </button>
      </div>
    </div>
  );
}

export default AddExpenseForm
