import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
<<<<<<< HEAD
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
=======
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Caught by Boundary:", error, errorInfo);
>>>>>>> d15a2d968d9eeb894dfd79bbb993444e4a8a0121
  }

  render() {
    if (this.state.hasError) {
      return (
<<<<<<< HEAD
        <div className="p-6">
          <h2 className="text-lg font-semibold text-red-600">Something went wrong.</h2>
          <pre className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
            {this.state.error?.toString()}
          </pre>
=======
        <div className="p-10 text-center bg-red-50 border border-red-200 rounded-lg">
          <h2 className="text-xl font-bold text-red-700">Unable to load this module</h2>
          <p className="text-gray-600">This might be due to missing permissions or a data error.</p>
          <button 
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
>>>>>>> d15a2d968d9eeb894dfd79bbb993444e4a8a0121
        </div>
      );
    }

<<<<<<< HEAD
    return this.props.children;
=======
    return this.props.children; 
>>>>>>> d15a2d968d9eeb894dfd79bbb993444e4a8a0121
  }
}

export default ErrorBoundary;