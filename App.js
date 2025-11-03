
import React, { useState, useEffect, useRef, useCallback } from 'react';

const App = () => {
  const [timeRemaining, setTimeRemaining] = useState(0); // Total seconds remaining
  const [isRunning, setIsRunning] = useState(false);
  const [minutesInput, setMinutesInput] = useState('0'); // String input for minutes
  const [secondsInput, setSecondsInput] = useState('0'); // String input for seconds
  const [isFinished, setIsFinished] = useState(false); // State to display "Time's Up!"

  // In a browser environment, `setInterval` returns a number (the interval ID), not NodeJS.Timeout.
  const intervalRef = useRef(null);
  const audioRef = useRef(null);
  // Source for a simple beep sound. Using a publicly available sound for demonstration.
  const audioSrc = "https://www.soundjay.com/buttons/beep-07.wav";

  // Helper to format total seconds into MM:SS string
  const formatTime = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Memoized function to update `timeRemaining` based on current `minutesInput` and `secondsInput`
  // This is used when the timer is not running to reflect user input in the display immediately.
  const updateTimeFromInputs = useCallback(() => {
    const minutes = parseInt(minutesInput, 10) || 0;
    const seconds = parseInt(secondsInput, 10) || 0;
    setTimeRemaining(minutes * 60 + seconds);
  }, [minutesInput, secondsInput]);

  // Effect to synchronize the display (`timeRemaining`) with the input fields when the timer is not running.
  // This ensures that typing in the inputs updates the main timer display.
  useEffect(() => {
    if (!isRunning) {
      updateTimeFromInputs();
    }
  }, [minutesInput, secondsInput, isRunning, updateTimeFromInputs]);

  // Handles starting the timer.
  const startTimer = useCallback(() => {
    // If timer has time and is not running, start it.
    if (timeRemaining > 0 && !isRunning) {
      setIsRunning(true);
      setIsFinished(false);
    } else if (timeRemaining === 0) {
      // If time is 0 (e.g., just reset or initial state), calculate from inputs and then start.
      const minutes = parseInt(minutesInput, 10) || 0;
      const seconds = parseInt(secondsInput, 10) || 0;
      const initialTime = minutes * 60 + seconds;
      if (initialTime > 0) {
        setTimeRemaining(initialTime);
        setIsRunning(true);
        setIsFinished(false);
      }
    }
  }, [timeRemaining, isRunning, minutesInput, secondsInput]);

  // Handles pausing the timer.
  const pauseTimer = useCallback(() => {
    setIsRunning(false);
  }, []);

  // Handles resetting the timer to its initial state.
  const resetTimer = useCallback(() => {
    setIsRunning(false);
    setTimeRemaining(0);
    setMinutesInput('0');
    setSecondsInput('0');
    setIsFinished(false);
    // Clear any active interval to prevent memory leaks.
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    // Stop and reset audio playback.
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, []);

  // Main countdown logic using useEffect for side effects (interval management).
  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      // Set up the interval to decrement timeRemaining every second.
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prevTime => prevTime - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isRunning) {
      // When time runs out and the timer was running, mark as finished.
      setIsRunning(false);
      setIsFinished(true);
      // Play the alarm sound.
      if (audioRef.current) {
        audioRef.current.play();
      }
      // Clear the interval as the timer has stopped.
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    // Cleanup function: ensures the interval is cleared when the component unmounts
    // or when the dependencies (`isRunning`, `timeRemaining`) change, preventing multiple intervals.
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining]); // Dependencies: re-run effect when these change.

  // Handler for minutes input change.
  const handleMinutesChange = useCallback((e) => {
    const value = e.target.value;
    // Update the input string state directly for controlled component behavior.
    setMinutesInput(value);
    // Only update `timeRemaining` if the timer is not actively running.
    // If it's running, `timeRemaining` is handled by the useEffect countdown.
    if (!isRunning) {
      const parsedValue = parseInt(value, 10);
      const newMinutes = isNaN(parsedValue) ? 0 : Math.max(0, Math.min(99, parsedValue));
      setTimeRemaining(newMinutes * 60 + (parseInt(secondsInput, 10) || 0));
    }
  }, [isRunning, secondsInput]);

  // Handler for seconds input change.
  const handleSecondsChange = useCallback((e) => {
    const value = e.target.value;
    setSecondsInput(value);
    if (!isRunning) {
      const parsedValue = parseInt(value, 10);
      const newSeconds = isNaN(parsedValue) ? 0 : Math.max(0, Math.min(59, parsedValue));
      setTimeRemaining((parseInt(minutesInput, 10) || 0) * 60 + newSeconds);
    }
  }, [isRunning, minutesInput]);

  // Determine if the "Start" button should be enabled.
  // It's enabled if `timeRemaining` is positive OR if there are positive values in the input fields.
  const canStart = timeRemaining > 0 || (parseInt(minutesInput, 10) || 0) > 0 || (parseInt(secondsInput, 10) || 0) > 0;

  // Determine if the "Reset" button should be shown.
  // It's shown if the timer is running, has time set, has finished, or if `canStart` is true (meaning time was set).
  const showReset = isRunning || timeRemaining > 0 || isFinished || canStart;

  return React.createElement(
    "div",
    {
      className:
        "min-h-screen bg-gradient-to-br from-indigo-900 to-purple-800 flex items-center justify-center p-4",
    },
    React.createElement(
      "div",
      {
        className:
          "bg-white bg-opacity-10 backdrop-blur-lg rounded-3xl shadow-2xl p-6 sm:p-10 w-full max-w-sm border border-white border-opacity-20 transform transition-all duration-300 hover:scale-105",
      },
      React.createElement(
        "h1",
        {
          className:
            "text-3xl sm:text-4xl font-extrabold text-white text-center mb-6 drop-shadow-lg",
        },
        "Countdown Timer"
      ),
      isFinished
        ? React.createElement(
            "div",
            {
              className:
                "text-red-400 text-6xl font-extrabold text-center my-8 animate-pulse",
            },
            "Time's Up!"
          )
        : React.createElement(
            "div",
            {
              className:
                "text-white text-6xl sm:text-7xl font-mono font-bold text-center mb-8 drop-shadow-lg",
            },
            formatTime(timeRemaining)
          ),
      React.createElement(
        "div",
        { className: "flex justify-center items-center space-x-4 mb-8" },
        React.createElement("input", {
          type: "number",
          min: "0",
          max: "99",
          value: minutesInput,
          onChange: handleMinutesChange,
          disabled: isRunning,
          className:
            "w-20 p-3 text-center text-white bg-white bg-opacity-20 rounded-xl text-3xl font-mono focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50 transition-colors duration-200",
          "aria-label": "Minutes input",
        }),
        React.createElement(
          "span",
          { className: "text-white text-4xl font-bold" },
          ":"
        ),
        React.createElement("input", {
          type: "number",
          min: "0",
          max: "59",
          value: secondsInput,
          onChange: handleSecondsChange,
          disabled: isRunning,
          className:
            "w-20 p-3 text-center text-white bg-white bg-opacity-20 rounded-xl text-3xl font-mono focus:outline-none focus:ring-2 focus:ring-purple-400 disabled:opacity-50 transition-colors duration-200",
          "aria-label": "Seconds input",
        })
      ),
      React.createElement(
        "div",
        { className: "flex justify-center space-x-3 sm:space-x-4" },
        !isRunning &&
          !isFinished &&
          React.createElement(
            "button",
            {
              onClick: startTimer,
              disabled: !canStart,
              className:
                "flex-1 px-4 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-full shadow-lg transform hover:scale-105 transition-all duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed",
            },
            "Start"
          ),
        isRunning &&
          React.createElement(
            "button",
            {
              onClick: pauseTimer,
              className:
                "flex-1 px-4 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-full shadow-lg transform hover:scale-105 transition-all duration-200",
            },
            "Pause"
          ),
        showReset &&
          React.createElement(
            "button",
            {
              onClick: resetTimer,
              className:
                "flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full shadow-lg transform hover:scale-105 transition-all duration-200",
            },
            "Reset"
          )
      )
    ),
    React.createElement("audio", {
      ref: audioRef,
      src: audioSrc,
      loop: false,
      preload: "auto",
    })
  );
};

export default App;
