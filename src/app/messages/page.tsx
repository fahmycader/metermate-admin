'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usersAPI, messagesAPI } from '@/lib/api';
import AdminLayout from '@/components/AdminLayout';

interface User {
  _id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface Message {
  _id: string;
  sender: User | null;
  recipient: User;
  title: string;
  body: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export default function MessagesPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sendLoading, setSendLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [messageTitle, setMessageTitle] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    message: Message | null;
    isLoading: boolean;
  }>({
    isOpen: false,
    message: null,
    isLoading: false,
  });
  const { user } = useAuth();

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch meter readers for the dropdown
      const usersResponse = await usersAPI.getMeterUsers();
      setUsers(usersResponse.users || []);
      
      // Fetch all messages
      const messagesResponse = await messagesAPI.getMessages();
      setMessages(messagesResponse.data || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(`Failed to fetch data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || !messageTitle.trim() || !messageBody.trim()) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setSendLoading(true);
      setError('');
      
      await messagesAPI.sendMessage({
        recipient: selectedUser,
        title: messageTitle.trim(),
        body: messageBody.trim(),
        type: 'admin'
      });
      
      // Reset form
      setSelectedUser('');
      setMessageTitle('');
      setMessageBody('');
      setShowSendDialog(false);
      
      // Refresh messages
      await fetchData();
      
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(`Failed to send message: ${error.message}`);
    } finally {
      setSendLoading(false);
    }
  };

  const handleMarkAsRead = async (messageId: string) => {
    try {
      await messagesAPI.markAsRead(messageId);
      // Refresh messages
      await fetchData();
    } catch (error: any) {
      console.error('Error marking message as read:', error);
      setError(`Failed to mark message as read: ${error.message}`);
    }
  };

  const handleDeleteMessage = (messageToDelete: Message) => {
    setDeleteDialog({
      isOpen: true,
      message: messageToDelete,
      isLoading: false,
    });
  };

  const confirmDeleteMessage = async () => {
    if (!deleteDialog.message) return;

    setDeleteDialog(prev => ({ ...prev, isLoading: true }));

    try {
      await messagesAPI.deleteMessage(deleteDialog.message._id);
      
      // Remove message from local state
      setMessages(prev => prev.filter(m => m._id !== deleteDialog.message!._id));
      
      // Close dialog
      setDeleteDialog({
        isOpen: false,
        message: null,
        isLoading: false,
      });

      // Show success message
      setError('');
    } catch (error: any) {
      console.error('Error deleting message:', error);
      setError(`Failed to delete message: ${error.message}`);
      setDeleteDialog(prev => ({ ...prev, isLoading: false }));
    }
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({
      isOpen: false,
      message: null,
      isLoading: false,
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="text-lg font-medium text-gray-900 mb-2">Loading Messages...</div>
            <div className="text-sm text-gray-500">Fetching message data from database</div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (user?.role !== 'admin') {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600">This page is only accessible to administrators.</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Message Management</h1>
            <p className="mt-1 text-sm text-gray-500">Send messages to meter readers and view all messages</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchData}
              className="bg-gray-600 text-white px-4 py-2 rounded-md text-sm hover:bg-gray-700 flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
            <button
              onClick={() => setShowSendDialog(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700 flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send Message
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-600">{error}</div>
          </div>
        )}

        {/* Send Message Dialog */}
        {showSendDialog && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Send Message to Meter Reader</h3>
                <form onSubmit={handleSendMessage} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Meter Reader
                    </label>
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      required
                    >
                      <option value="">Choose a meter reader...</option>
                      {users.map((user) => (
                        <option key={user._id} value={user._id}>
                          {user.firstName} {user.lastName} ({user.username})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message Title
                    </label>
                    <input
                      type="text"
                      value={messageTitle}
                      onChange={(e) => setMessageTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      placeholder="Enter message title..."
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message Body
                    </label>
                    <textarea
                      value={messageBody}
                      onChange={(e) => setMessageBody(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      placeholder="Enter your message..."
                      required
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowSendDialog(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sendLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {sendLoading ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Messages List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                All Messages
              </h3>
              <div className="text-sm text-gray-500">
                Total messages: <span className="font-medium">{messages.length}</span>
              </div>
            </div>

            {messages.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500">No messages found</div>
                <div className="text-sm text-gray-400 mt-2">
                  Send a message to a meter reader to get started
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message._id}
                    className={`border rounded-lg p-4 ${
                      message.read ? 'bg-gray-50 border-gray-200' : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className={`font-medium ${message.read ? 'text-gray-700' : 'text-blue-900'}`}>
                            {message.title}
                          </h4>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            message.type === 'admin' ? 'bg-blue-100 text-blue-800' :
                            message.type === 'mileage_report' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {message.type ? message.type.replace('_', ' ') : 'Unknown'}
                          </span>
                          {!message.read && (
                            <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                              Unread
                            </span>
                          )}
                        </div>
                        
                        <p className={`text-sm mb-2 ${message.read ? 'text-gray-600' : 'text-blue-800'}`}>
                          {message.body}
                        </p>
                        
                        <div className="text-xs text-gray-500">
                          <div>
                            <strong>To:</strong> {message.recipient.firstName} {message.recipient.lastName} ({message.recipient.username})
                          </div>
                          {message.sender && (
                            <div>
                              <strong>From:</strong> {message.sender.firstName} {message.sender.lastName}
                            </div>
                          )}
                          <div>
                            <strong>Sent:</strong> {new Date(message.createdAt).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      
                      <div className="ml-4 flex space-x-2">
                        {!message.read && (
                          <button
                            onClick={() => handleMarkAsRead(message._id)}
                            className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 border border-green-300 rounded-md hover:bg-green-200"
                          >
                            Mark as Read
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteMessage(message)}
                          className="px-3 py-1 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 flex items-center gap-1"
                          title="Delete Message"
                        >
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteDialog.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="mt-2 text-center">
                <h3 className="text-lg font-medium text-gray-900">Delete Message</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Are you sure you want to delete this message? This action cannot be undone.
                  </p>
                  {deleteDialog.message && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-md">
                      <p className="text-sm font-medium text-gray-900">{deleteDialog.message.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        To: {deleteDialog.message.recipient.firstName} {deleteDialog.message.recipient.lastName}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="mt-4 flex justify-center space-x-3">
                <button
                  type="button"
                  onClick={closeDeleteDialog}
                  disabled={deleteDialog.isLoading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteMessage}
                  disabled={deleteDialog.isLoading}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 disabled:opacity-50"
                >
                  {deleteDialog.isLoading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
