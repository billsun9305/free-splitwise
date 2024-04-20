import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import EntryForm from './EntryForm'; // You'll need to create this component for the form
import EntryList from './EntryList'; // You'll need to create this component for listing entries
import LogoutButton from '../components/LogoutButton';

const Check = () => {
    const { groupId } = useParams();
    const [entries, setEntries] = useState([]);
    const [form, setForm] = useState({ date: '', title: '', amount: '', groupId});
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
  
    // If the effect doesn't rely on any props or state that change, it can be safe to omit functions from the dependency array — just be aware that this is more of an exception to the rule.
    // Fetch data from backend
    useEffect(() => {
      const fetchEntries = async () => {
        try {
          console.log("Fetch entry with group id = " + groupId);
          const response = await fetch(`https://api.splitwise.world/api/entries?groupId=${groupId}`, {
          // const response = await fetch(`http://localhost:8080/api/entries?groupId=${groupId}`, {
          // const response = await fetch(`https://free-splitwise-f7e9136cd3b7.herokuapp.com/api/entries?groupId=${groupId}`, {

            credentials: 'include', // Ensure cookies, such as session cookies, are sent with the request
            redirect: 'follow' // This might be the default, allows following redirects automatically
          });
          const data = await response.json();
          setEntries(data);
          // setEntries(data.map(entry => ({ ...entry, id: entry.id })));
        } catch (error) {
          console.error('Error fetching entries:', error);
        }
      };
      fetchEntries();
    }, [groupId]);
  
      // Add entry to the backend
    const addEntry = async (newEntry) => {
      try {
        const response = await fetch('https://api.splitwise.world/api/entries', {

        // const response = await fetch('http://localhost:8080/api/entries', {
        // const response = await fetch('https://free-splitwise-f7e9136cd3b7.herokuapp.com/api/entries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(newEntry),
          credentials: 'include', // Ensure cookies, such as session cookies, are sent with the request
          redirect: 'follow' // This might be the default, allows following redirects automatically
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
        const response = await fetch(`https://api.splitwise.world/api/entries/${id}`, {

        // const response = await fetch(`http://localhost:8080/api/entries/${id}`, {
        // const response = await fetch(`https://free-splitwise-f7e9136cd3b7.herokuapp.com/api/entries/${id}`, {
  
          method: 'DELETE',
          credentials: 'include', // Ensure cookies, such as session cookies, are sent with the request
          redirect: 'follow' 
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
        const response = await fetch('https://api.splitwise.world/api/entries', {

        // const response = await fetch('http://localhost:8080/api/entries', {
        // const response = await fetch('https://free-splitwise-f7e9136cd3b7.herokuapp.com/api/entries', {
  
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedEntry),
          credentials: 'include', // Ensure cookies, such as session cookies, are sent with the request
          redirect: 'follow' 
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
      <div className="min-h-screen bg-gradient-to-r from-blue-500 to-teal-400">
        <div className="container mx-auto max-w-5xl p-10">
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-4xl font-bold text-white">Check Details</h1>
            <LogoutButton className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-lg transition ease-in duration-200" />
          </div>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <EntryForm
              handleSubmit={handleSubmit}
              handleInputChange={handleInputChange}
              form={form}
              editingId={editingId}
            />
            <EntryList
              entries={entries}
              handleEditChange={handleEditChange}
              saveEditEntry={saveEditEntry}
              startEditEntry={startEditEntry}
              deleteEntry={deleteEntry}
              editingId={editingId}
            />
          </div>
        </div>
      </div>
    );
};

export default Check;
