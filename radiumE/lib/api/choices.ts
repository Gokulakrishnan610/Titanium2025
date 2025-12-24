/**
 * API functions for fetching dynamic year and department choices
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface YearChoice {
  code: string;
  display_name: string;
}

export interface DepartmentChoice {
  code: string;
  full_name: string;
  category: 'UG' | 'PG' | 'PhD';
}

/**
 * Fetch all active year choices
 */
export async function getYearChoices(): Promise<YearChoice[]> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/choices/years/`);
    if (!response.ok) {
      throw new Error('Failed to fetch year choices');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching year choices:', error);
    return [];
  }
}

/**
 * Fetch all active department choices
 * @param category - Optional filter by category (UG, PG, PhD)
 */
export async function getDepartmentChoices(category?: 'UG' | 'PG' | 'PhD'): Promise<DepartmentChoice[]> {
  try {
    const url = category
      ? `${API_BASE_URL}/api/users/choices/departments/?category=${category}`
      : `${API_BASE_URL}/api/users/choices/departments/`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch department choices');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching department choices:', error);
    return [];
  }
}

/**
 * Custom hook to fetch year choices
 */
export function useYearChoices() {
  const [years, setYears] = React.useState<YearChoice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchYears() {
      try {
        setLoading(true);
        const data = await getYearChoices();
        setYears(data);
        setError(null);
      } catch (err) {
        setError('Failed to load years');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchYears();
  }, []);

  return { years, loading, error };
}

/**
 * Custom hook to fetch department choices
 */
export function useDepartmentChoices(category?: 'UG' | 'PG' | 'PhD') {
  const [departments, setDepartments] = React.useState<DepartmentChoice[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function fetchDepartments() {
      try {
        setLoading(true);
        const data = await getDepartmentChoices(category);
        setDepartments(data);
        setError(null);
      } catch (err) {
        setError('Failed to load departments');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchDepartments();
  }, [category]);

  return { departments, loading, error };
}

import React from 'react';
