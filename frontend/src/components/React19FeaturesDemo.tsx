// React 19 Features Implementation for Frontend Components

import { useState, use, useOptimistic, useActionState, useEffectEvent, Activity } from "react";
import { cacheSignal, cache } from "react";

// Mock data for demonstration purposes
const mockUsers = [
  { id: 1, name: "John Doe", email: "john@example.com" },
  { id: 2, name: "Jane Smith", email: "jane@example.com" },
  { id: 3, name: "Bob Johnson", email: "bob@example.com" }
];

// Simulate async data fetching with cacheSignal
async function fetchUser(id: number): Promise<{ id: number; name: string; email: string }> {
  // Artificial delay to simulate network request
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const user = mockUsers.find(u => u.id === id);
  if (!user) throw new Error("User not found");
  return user;
}

// Cache with automatic cleanup using cacheSignal
const fetchCachedUser = cache(async (id: number) => {
  const controller = new AbortController();
  const signal = cacheSignal();

  signal.addEventListener("abort", () => {
    console.log(`Cache expired for user ${id}`);
    controller.abort();
  });

  try {
    const response = await fetch(`/api/users/${id}`, {
      signal: controller.signal,
    });
    
    if (!response.ok) throw new Error("Failed to fetch user");
    return await response.json();
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("Fetch aborted due to cache expiration");
    }
    throw error;
  }
});

// Simulate a server action for form submission
async function createUser(prevState: { success?: boolean; error?: string }, formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  if (!name || !email) {
    return { error: "Name and email are required" };
  }

  // Simulate network request
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return { success: true };
}

// Simulate a database update function
async function updateUser(id: number, updates: { name?: string; email?: string }): Promise<{ id: number; name: string; email: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const user = mockUsers.find(u => u.id === id);
  if (!user) throw new Error("User not found");
  
  return {
    ...user,
    ...(updates.name ? { name: updates.name } : {}),
    ...(updates.email ? { email: updates.email } : {})
  };
}

// Simulate a server action for updating user
async function updateUserAction(id: number, formData: FormData): Promise<{ success?: boolean; error?: string }> {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  if (!name && !email) {
    return { error: "At least one field is required" };
  }

  try {
    await updateUser(id, { name, email });
    return { success: true };
  } catch (error) {
    return { error: "Failed to update user" };
  }
}

// Simulate a server action for deleting user
async function deleteUserAction(id: number): Promise<{ success?: boolean; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const index = mockUsers.findIndex(u => u.id === id);
  if (index === -1) {
    return { error: "User not found" };
  }
  
  return { success: true };
}

export default function React19FeaturesDemo() {
  // Demo state for user list
  const [users, setUsers] = useState<{ id: number; name: string; email: string }[]>(mockUsers);
  const [activeTab, setActiveTab] = useState<"users" | "form">("users");
  
  // Demo data for form submission using useActionState
  const [actionState, actionForm] = useActionState(createUser, { success: false, error: "" });
  
  // Demo data for optimistic updates with useOptimistic
  const [optimisticUsers, addOptimisticUser] = useOptimistic(users, (state, newUser) => [...state, newUser]);
  
  // Demo data for user update with useActionState and optimistic updates
  const [updateActionState, updateForm] = useActionState(updateUserAction, { success: false, error: "" });
  
  // Demo data for user deletion with useActionState and optimistic updates
  const [deleteActionState, deleteForm] = useActionState(deleteUserAction, { success: false, error: "" });

  // Simulate a search function that returns a promise
  const searchUsers = (query: string) => {
    return new Promise<{ id: number; name: string; email: string }[]>(resolve => {
      setTimeout(() => {
        resolve(mockUsers.filter(user => user.name.toLowerCase().includes(query.toLowerCase())));
      }, 200);
    });
  };

  // Demo state for search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Promise<{ id: number; name: string; email: string }[]> | null>(null);

  // useEffectEvent to extract non-reactive logic from effects
  const onMessageReceived = useEffectEvent((message: string) => {
    console.log(`Message received: ${message}`);
    // This function doesn't re-render when theme changes
  });

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">React 19.2 Features Demo</h1>
      
      <nav className="mb-6 flex gap-4">
        <button 
          onClick={() => setActiveTab("users")} 
          className={`px-4 py-2 rounded ${activeTab === "users" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          Users
        </button>
        <button 
          onClick={() => setActiveTab("form")} 
          className={`px-4 py-2 rounded ${activeTab === "form" ? "bg-blue-500 text-white" : "bg-gray-200"}`}
        >
          Create User
        </button>
      </nav>

      <Activity mode={activeTab === "users" ? "visible" : "hidden"}>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Users List</h2>
          
          {/* use() hook demonstration */}
          <div className="mb-6">
            <h3 className="font-medium mb-2">User Detail (use() hook)</h3>
            <div className="border border-gray-300 p-4 rounded">
              {optimisticUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between mb-2">
                  <span>{user.name}</span>
                  <span>{user.email}</span>
                  <button onClick={() => {
                    const tempUser = { ...user, name: "Temp User" };
                    addOptimisticUser(tempUser);
                    updateUserAction(user.id, new FormData()).then(() => {
                      setUsers(prev => prev.filter(u => u.id !== user.id));
                    });
                  }}>
                    Delete
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* cacheSignal demonstration */}
          <div className="mb-6">
            <h3 className="font-medium mb-2">Cached User Fetch (cacheSignal)</h3>
            <div className="border border-gray-300 p-4 rounded">
              {optimisticUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between mb-2">
                  <span>{user.name}</span>
                  <span>{user.email}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Search functionality */}
          <div className="mb-6">
            <h3 className="font-medium mb-2">Search Users</h3>
            <input 
              type="text" 
              placeholder="Search users..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded"
            />
            <div className="mt-2 border border-gray-300 p-4 rounded">
              {searchResults ? (
                <div>
                  <h4 className="font-medium">Search Results:</h4>
                  {use(searchResults).map((user) => (
                    <div key={user.id} className="flex items-center justify-between mb-1">
                      <span>{user.name}</span>
                      <span>{user.email}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Enter a search term</p>
              )}
            </div>
          </div>
        </div>
      </Activity>

      <Activity mode={activeTab === "form" ? "visible" : "hidden"}>
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Create New User</h2>
          
          {/* useActionState demonstration */}
          <form action={actionForm} className="mb-6">
            <div className="grid grid-cols-1 gap-4">
              <input 
                type="text" 
                name="name" 
                placeholder="Name" 
                required
                className="w-full p-2 border border-gray-300 rounded"
              />
              <input 
                type="email" 
                name="email" 
                placeholder="Email" 
                required
                className="w-full p-2 border border-gray-300 rounded"
              />
              {actionState.error && <p className="text-red-500">{actionState.error}</p>}
              {actionState.success && <p className="text-green-500">User created!</p>}
              <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
                Create User
              </button>
            </div>
          </form>

          {/* useOptimistic demonstration */}
          <div className="mb-6">
            <h3 className="font-medium mb-2">Optimistic Updates</h3>
            <div className="border border-gray-300 p-4 rounded">
              <div className="flex items-center justify-between mb-2">
                <span>Optimistic User</span>
                <span>temp@user.com</span>
                <button onClick={() => {
                  const newUser = { id: 99, name: "New User", email: "new@user.com" };
                  addOptimisticUser(newUser);
                  createUser(null, new FormData()).then(() => {
                    setUsers(prev => [...prev, newUser]);
                  });
                }}>
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* useEffectEvent demonstration */}
          <div className="mb-6">
            <h3 className="font-medium mb-2">UseEffectEvent Demo</h3>
            <div className="border border-gray-300 p-4 rounded">
              <p className="text-gray-700">
                useEffectEvent allows extracting non-reactive logic from effects. 
                This function handles messages without re-rendering when theme changes.
              </p>
            </div>
          </div>

          {/* Activity component demonstration */}
          <div className="mb-6">
            <h3 className="font-medium mb-2">Activity Component Demo</h3>
            <div className="border border-gray-300 p-4 rounded">
              <p className="text-gray-700">
                Activity preserves UI state when hidden. This is particularly useful for tabbed interfaces 
                where you want to maintain the state of components that are not active.
              </p>
            </div>
          </div>
        </div>
      </Activity>
    </div>
  );
}