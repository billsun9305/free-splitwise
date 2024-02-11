import logo from './logo.png';
import './App.css';

import React, { useState, useEffect} from 'react';

function App() {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState({ date: '', title: '', amount: '' });
  const [editingId, setEditingId] = useState(null);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm({ ...form, [name]: value });
  };

  // Modified handleSubmit to handle both add and update
  const handleSubmit = (event) => {
    event.preventDefault();
    if (editingId) {
      updateEntry({ ...form, id: editingId });
    } else {
      addEntry(form);
    }
    setForm({ date: '', title: '', amount: '' }); // Reset the form fields
    setEditingId(null); // Reset editingId
  };

  // Function to handle change on edit input fields
  const handleEditChange = (id, field, value) => {
    setEntries(entries.map(entry =>
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };


  // Fetch data from backend
  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/entries');
      // const response = await fetch('https://free-splitwise-f7e9136cd3b7.herokuapp.com/api/entries');
      const data = await response.json();
      setEntries(data);
      // setEntries(data.map(entry => ({ ...entry, id: entry.id })));
    } catch (error) {
      console.error('Error fetching entries:', error);
    }
  };

    // Add entry to the backend
  const addEntry = async (newEntry) => {
    try {
      const response = await fetch('http://localhost:8080/api/entries', {
      // const response = await fetch('https://free-splitwise-f7e9136cd3b7.herokuapp.com/api/entries', {
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

  // Function to delete entry
  const deleteEntry = async (id) => {
    try {
      const response = await fetch(`http://localhost:8080/api/entries/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setEntries(entries.filter(entry => entry.id !== id));
      } else {
        console.error('Failed to delete entry');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
    }
  };

  const updateEntry = async (updatedEntry) => {
    try {
      const response = await fetch('http://localhost:8080/api/entries', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEntry),
      });
      if (response.ok) {
        const updatedEntry = await response.json();
        // Update the entries state to reflect the update
        setEntries(entries.map(entry => entry.id === updatedEntry.id ? updatedEntry : entry));
        setEditingId(null); // Reset editingId
      } else {
        console.error('Failed to update entry', await response.text());
      }
    } catch (error) {
      console.error('Error updating entry:', error);
    }
  };

  // Function to start editing an entry
  const startEditEntry = (id) => {
    setEditingId(id);
  };

  // Function to save the edited entry
  const saveEditEntry = (id) => {
    const entryToSave = entries.find(entry => entry.id === id);
    updateEntry(entryToSave);
    setEditingId(null); // Exit edit mode
  };


  return (
    <div className="container mx-auto my-10 p-8">
      {/* {editingId && <h2 className="text-lg mb-4">Editing Entry</h2>} */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label htmlFor="date" className="block text-gray-700 text-sm font-bold mb-2">Date:</label>
          <input type="date" name="date" value={form.date} onChange={handleInputChange} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
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
            <th className="w-1/3 px-4 py-2 text-gray-300"></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="bg-gray-200">
              {editingId === entry.id ? (
                // If in edit mode, render input fields
                <>
                  <td className="border px-4 py-2">
                    <input type="date" value={entry.date} onChange={(e) => handleEditChange(entry.id, 'date', e.target.value)} />
                  </td>
                  <td className="border px-4 py-2">
                    <input type="text" value={entry.title} onChange={(e) => handleEditChange(entry.id, 'title', e.target.value)} />
                  </td>
                  <td className="border px-4 py-2">
                    <input type="number" value={entry.amount} onChange={(e) => handleEditChange(entry.id, 'amount', e.target.value)} />
                  </td>
                </>
              ) : (
                // If not in edit mode, display text
                <>
                  <td className="border px-4 py-2">{entry.date}</td>
                  <td className="border px-4 py-2">{entry.title}</td>
                  <td className="border px-4 py-2">{entry.amount}</td>
                </>
              )}
              <td className="border px-4 py-2 text-right">
                <div className="flex justify-end items-center space-x-2"> {/* Flex container for buttons */}
                  {editingId === entry.id ? (
                    <button
                      onClick={() => saveEditEntry(entry.id)}
                      className="text-sm bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                    >
                      Save
                    </button>
                  ) : (
                    <button
                      onClick={() => startEditEntry(entry.id)}
                      className="text-sm bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                    >
                      Edit
                    </button>
                  )}
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="text-sm bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App
