import React from 'react';

const EntryForm = ({ handleSubmit, handleInputChange, form, editingId }) => {
  return (
    <div className="mx-auto my-10 p-6 max-w-4xl bg-white rounded shadow">
      {editingId && <h2 className="text-lg mb-4 text-center">Editing Entry</h2>}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="mb-4">
          <label htmlFor="date" className="block text-gray-700 text-sm font-bold mb-2">Date:</label>
          <input
            type="date"
            name="date"
            id="date"
            value={form.date}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">Title:</label>
          <input
            type="text"
            name="title"
            id="title"
            value={form.title}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="amount" className="block text-gray-700 text-sm font-bold mb-2">Amount:</label>
          <input
            type="number"
            name="amount"
            id="amount"
            value={form.amount}
            onChange={handleInputChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          {editingId ? 'Update Entry' : 'Add Entry'}
        </button>
      </form>
    </div>
  );
};

export default EntryForm;
