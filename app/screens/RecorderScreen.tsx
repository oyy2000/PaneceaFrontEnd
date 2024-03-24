import React, { FC, useState } from "react"
import { View, TouchableOpacity, ViewStyle, TextStyle } from "react-native";
import { Screen, Text } from "../components"
import { DemoTabScreenProps } from "../navigators/DemoNavigator"
import { spacing, colors } from "../theme"
// Import your audio recording library components here
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

export const RecorderScreen: FC<DemoTabScreenProps<"Recorder">> =
  function RecorderScreen(_props) {
    // Local state to manage recording status

    // Function to start recording
    const [recording, setRecording] = useState<Audio.Recording | null>(null);
    const [permissionResponse, requestPermission] = Audio.usePermissions();
    const [currentMood, setCurrentMood] = useState('neutral');

    const $container: ViewStyle = {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingTop: spacing.lg + spacing.xl,
      paddingHorizontal: spacing.lg,
      backgroundColor: background(currentMood),
    };
    
    async function startRecording() {
      try {
        if (permissionResponse?.status !== 'granted') {
          console.log('Requesting permission..');
          await requestPermission();
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });

        console.log('Starting recording..');
        const { recording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );
        setRecording(recording);
        console.log('Recording started');
      } catch (err) {
        console.error('Failed to start recording', err);
      }
    }

    async function stopRecording() {
      console.log('Stopping recording..');
      if (!recording) return;
    
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
    
      if (uri) {
        // Create the fileUri string right here, ensuring it's not null when used.
        const newFileUri = `${FileSystem.documentDirectory}audio-recording.wav`; // This will always be a string.
        console.log('Recording is saved as:', uri);
        
        try {
          await FileSystem.moveAsync({
            from: uri,
            to: newFileUri, // Use the new, guaranteed string here
          });
          console.log('Recording is saved to:', newFileUri);
          uploadFileToServer(newFileUri); // Upload the file after saving
        } catch (error) {
          console.error('Error saving recording', error);
        }
      }
    
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      setRecording(null);
      // Randomize the mood state to simulate a new mood
      const random = Math.random();
      if (random < 0.2) setCurrentMood('happy');
      else if (random < 0.4) setCurrentMood('sad');
      else if (random < 0.6) setCurrentMood('neutral');
      else if (random < 0.8) setCurrentMood('relaxed');
      else setCurrentMood('angry'); // Reset the mood state to 'angry'
    }
  
    async function uploadFileToServer(fileUri: string) {
      const url = "http://127.0.0.1:5000"; // Replace with your server endpoint
      const filename = fileUri.split('/').pop();
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: filename,
        type: 'audio/wav',
      } as any); // Use 'as any' to bypass TypeScript's type checking

      try {
        const response = await fetch(url, {
          method: 'POST',
          body: formData,
          headers: {
            'content-type': 'multipart/form-data',
          },
        });
        const result = await response.json();
        result.mood = 'Happy'; 
        setCurrentMood(result.mood); // Set the mood state with the result from the server
        console.log('Upload success:', result);
      } catch (error) {
        console.error('Upload error:', error);
      }
    }


    return (
      <Screen preset="scroll" contentContainerStyle={$container} safeAreaEdges={["top"]}>
        <Text preset="heading" style={$title}>Mood Meter</Text>
        
        <View style={$buttonContainer}>
        <Text style={$description}> Tap the button to begin recording your audio. For a moment or longer, you'll discover your mood based on the recording.</Text>
          <TouchableOpacity
            style={[
              $button,
              recording ? $buttonRecording : null, // Apply recording style if recording is true
            ]}
            onPress={recording ? stopRecording : startRecording}
          >
            <Text>
              {recording ? 'Stop' : 'Start'}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={$moodContainer}>
          <Text style={$moodText}>{currentMood.toUpperCase()}</Text> {/* status of your mood */}
        </View>
      </Screen>
    );
  };

  function background(mood: string): string {
    switch (mood) {
      case 'happy':
        return '#ffdd94'; // Khaki, a soft yellow
      case 'sad':
        return '#ccabdb'; // Blue Grey, a muted blue
      case 'angry':
        return '#fa897b'; // Rosy Brown, a softer red
      case 'relaxed':
        return '#d0e6a5'; // Light Green, even less saturated
      default:
        return colors.background; // White, as a default background color
    }
  }
  
  const $title: TextStyle = {
    marginBottom: spacing.sm,
  };
  
  const $moodText: TextStyle = {
    fontSize: 48,
    fontWeight: 'bold',
  };

  const $moodContainer: ViewStyle = {
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  };

  const $buttonContainer: ViewStyle = {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  };
  
  const $button: ViewStyle = {
    borderWidth: 2,
    borderColor: '#53abd8',
    alignItems: 'center',
    justifyContent: 'center',
    width: 180,
    height: 180,
    backgroundColor: '#c5e3e2',
    borderRadius: 90,
  };
  
  const $buttonRecording: ViewStyle = {
    borderColor: '#d882ad',
    backgroundColor: '#e4b7bc',
    // Additional styles for "recording" state could go here
  };
  

  const $description: TextStyle = {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.lg,
  };
 