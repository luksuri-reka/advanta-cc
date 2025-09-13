// Date formatting utility
export function formatDate(dateString: string): string {
  if (!dateString || dateString === '') {
    return '-';
  }

  try {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    // Format as DD-MM-YYYY
    return `${day}-${month}-${year}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return '-';
  }
}
