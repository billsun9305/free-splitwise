import logo from './logo.svg';
import './App.css';

import React, { useState, useEffect} from 'react';

function App() {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ date: '', title: '', amount: '' });

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    addEntry(form);
    setForm({ date: '', title: '', amount: '' }); // Reset the form fields
  };

  // Fetch data from backend
  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      // const response = await fetch('http://localhost:8080/api/entries');
      const response = await fetch('https://free-splitwise-f7e9136cd3b7.herokuapp.com/api/entries');
      const data = await response.json();
      setEntries(data);
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  };

    // Add entry to the backend
  const addEntry = async (newEntry) => {
    try {
      const response = await fetch('https://free-splitwise-f7e9136cd3b7.herokuapp.com/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEntry),
      });
      if (response.ok) {
        const entry = await response.json();
        setEntries([...entries, entry]);
      } else {
        console.error('Failed to add entry', await response.text());
      }
    } catch (error) {
      console.error('Error adding entry:', error);
    }
  };

  return (
    <div className="container mx-auto my-10 p-8">
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label htmlFor="date" className="block text-gray-700 text-sm font-bold mb-2">Date:</label>
          <input type="text" name="date" value={form.date} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
        </div>
        <div className="mb-4">
          <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">Title:</label>
          <input type="text" name="title" value={form.title} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
        </div>
        <div className="mb-4">
          <label htmlFor="amount" className="block text-gray-700 text-sm font-bold mb-2">Amount:</label>
          <input type="number" name="amount" value={form.amount} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
        </div>
        <button type="submit" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Add Entry</button>
      </form>

      <table className="table-fixed w-full">
        <thead>
          <tr className="bg-gray-800">
            <th className="w-1/3 px-4 py-2 text-gray-300">Date</th>
            <th className="w-1/3 px-4 py-2 text-gray-300">Title</th>
            <th className="w-1/3 px-4 py-2 text-gray-300">Amount</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => (
            <tr key={index} className="bg-gray-200">
              <td className="border px-4 py-2">{entry.date}</td>
              <td className="border px-4 py-2">{entry.title}</td>
              <td className="border px-4 py-2">{entry.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App
