/*
* This is an helper API helper to manage API requests
* @author: Tumelo George
* Date: 25/11/2025
*/

export const getApiUrl = (url: string) => {
  return `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}${url}`;
}

export async function fetchApi(
    path: string,
    method: string,
    body?: Record<string, any>,
    token?: string
  ) {
    const res = await fetch(getApiUrl(path), {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
}

//Product helper functions
export async function fetchProducts() {
  return fetchApi('/products', 'GET');
}
export async function fetchProductById(id: string) {
    return fetchApi(`/products/${id}`, 'GET');
}
export async function createProduct(productData: Record<string, any>, token: string) {
    return fetchApi('/products', 'POST', productData, token);
}
export async function updateProduct(id: string, productData: Record<string, any>, token: string) {
    return fetchApi(`/products/${id}`, 'PUT', productData, token);
}
export async function deleteProduct(id: string, token: string) {
    return fetchApi(`/products/${id}`, 'DELETE', undefined, token);
}

// User helper functions
export async function fetchUsers(token: string) {
  return fetchApi('/users', 'GET', undefined, token);
}
export async function fetchUserById(id: string, token: string) {
    return fetchApi(`/users/${id}`, 'GET', undefined, token);
}
export async function createUser(userData: Record<string, any>, token: string) {
    return fetchApi('/users', 'POST', userData, token);
}
export async function updateUser(id: string, userData: Record<string, any>, token: string) {
    return fetchApi(`/users/${id}`, 'PUT', userData, token);
}
export async function deleteUser(id: string, token: string) {
    return fetchApi(`/users/${id}`, 'DELETE', undefined, token);
}