import React, { useState, useEffect } from 'react';
import Input from '../Inputs/Input';
import EmojiPickerPopup from '../EmojiPickerPopup';

const AddIncomeForm = ({ onAddIncome, initialData }) => {
  const [income, setIncome] = useState({
    source: "",
    amount: "",
    date: "",
    icon: "",
  });

  useEffect(() => {
    if (initialData) {
      setIncome({
        source: initialData.source || "",
        amount: initialData.amount || "",
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : "",
        icon: initialData.icon || "",
      });
    }
  }, [initialData]);

  const handleChange = (key, value) =>
    setIncome({ ...income, [key]: value });

  return (
    <div>
      <Input
        value={income.source}
        onChange={({ target }) => handleChange("source", target.value)}
        label="Income Source"
        placeholder="Freelance, Salary, etc"
        type="text"
      />

      <Input
        value={income.amount}
        onChange={({ target }) => handleChange("amount", target.value)}
        label="Amount"
        placeholder=""
        type="number"
      />

      <div className='flex justify-between items-center gap-5'>
        <Input
          className="flex-1"
          value={income.date}
          onChange={({ target }) => handleChange("date", target.value)}
          label="Date"
          placeholder=""
          type="date"
        />
        <EmojiPickerPopup
          icon={income.icon}
          onSelect={(selectedIcon) => handleChange("icon", selectedIcon)}
        />
      </div>

      <div className="flex justify-end mt-6">
        <button
          type="button"
          className="add-btn add-btn-fill hover:scale-105 transition-transform"
          onClick={() => onAddIncome(income)}
        >
          {initialData ? "Update Income" : "Add Income"}
        </button>
      </div>
    </div>
  );
};

export default AddIncomeForm;
