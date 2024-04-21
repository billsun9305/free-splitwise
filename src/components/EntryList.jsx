import React from 'react';

const EntryList = ({ entries, handleEditChange, saveEditEntry, startEditEntry, deleteEntry, editingId }) => {
  return (
    <div className="my-4 px-0 sm:mx-auto max-w-4xl overflow-x-auto sm:overflow-x-visible">
      <table className="w-full text-left text-sm sm:text-base">
        <thead className="bg-gray-800 text-white">
          <tr>
            <th className="w-1/3 sm:w-1/4 px-4 py-2">Date</th>
            <th className="w-1/3 sm:w-1/4 px-4 py-2">Title</th>
            <th className="w-1/6 sm:w-1/4 px-4 py-2">Amount</th>
            {/* <th className="w-1/4 px-4 py-2 hidden sm:table-cell">Actions</th> */}
            <th className="w-1/6 sm:w-1/4 px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id} className="bg-gray-200">
              {editingId === entry.id ? (
                <>
                  <td className="border px-4 py-2">
                    <input
                      type="date"
                      className="w-full p-1 rounded border"
                      value={entry.date}
                      onChange={(e) => handleEditChange(entry.id, 'date', e.target.value)}
                    />
                  </td>
                  <td className="border px-4 py-2">
                    <input
                      type="text"
                      className="w-full p-1 rounded border"
                      value={entry.title}
                      onChange={(e) => handleEditChange(entry.id, 'title', e.target.value)}
                    />
                  </td>
                  <td className="border px-4 py-2">
                    <input
                      type="number"
                      className="w-full p-1 rounded border"
                      value={entry.amount}
                      onChange={(e) => handleEditChange(entry.id, 'amount', e.target.value)}
                    />
                  </td>
                  <td className="border px-4 py-2 text-right">
                    <button
                      onClick={() => saveEditEntry(entry.id)}
                      className="text-sm bg-green-500 hover:bg-green-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                    >
                      Save
                    </button>
                  </td>
                </>
              ) : (
                <>
                  <td className="border px-4 py-2">{entry.date}</td>
                  <td className="border px-4 py-2">{entry.title}</td>
                  <td className="border px-4 py-2">{entry.amount}</td>
                  {/* <td className="border px-4 py-2 text-right hidden sm:table-cell"> */}
                  <td className="border px-4 py-2 text-right">
                    <div className="flex justify-end items-center space-x-2">
                      <button
                        onClick={() => startEditEntry(entry.id)}
                        className="text-sm bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteEntry(entry.id)}
                        className="text-sm bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded focus:outline-none focus:shadow-outline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EntryList;
