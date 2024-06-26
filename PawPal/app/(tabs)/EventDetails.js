import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../supabaseClient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute } from '@react-navigation/native';

const EventDetailsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { eventId } = route.params;

  const [eventDetails, setEventDetails] = useState(null);
  const [startDate, setStartDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [applyFor, setApplyFor] = useState('');
  const [pets, setPets] = useState([]);
  const [showPetPicker, setShowPetPicker] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchUserAndEventDetails = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error('Error fetching user:', userError);
      } else {
        setUserId(user.id);
        const { data: eventData, error: eventError } = await supabase
          .from('schedule')
          .select('*')
          .eq('id', eventId)
          .single();

        if (eventError) {
          console.error('Error fetching event details:', eventError);
        } else {
          setEventDetails(eventData);
          const start = new Date(eventData.start_time);
          const end = new Date(eventData.end_time);
          setStartDate(start);
          setStartTime(start);
          setEndDate(end);
          setEndTime(end);
          setApplyFor(eventData.apply_for);
        }

        const { data: petData, error: petError } = await supabase
          .from('pets')
          .select('id, name, picture_url')
          .eq('user_id', user.id);

        if (petError) {
          console.error('Error fetching pets:', petError);
        } else {
          setPets(petData);
        }
      }
    };

    fetchUserAndEventDetails();
  }, [eventId]);

  const handleStartDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || startDate;
    setShowStartDatePicker(false);
    setStartDate(currentDate);
  };

  const handleStartTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || startTime;
    setShowStartTimePicker(false);
    setStartTime(currentTime);
  };

  const handleEndDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || endDate;
    setShowEndDatePicker(false);
    setEndDate(currentDate);
  };

  const handleEndTimeChange = (event, selectedTime) => {
    const currentTime = selectedTime || endTime;
    setShowEndTimePicker(false);
    setEndTime(currentTime);
  };

  const handleSubmit = async () => {
    // Combine start date and time
    const combinedStartDateTime = new Date(startDate);
    combinedStartDateTime.setHours(startTime.getHours(), startTime.getMinutes());
    const startTimeISO = new Date(combinedStartDateTime.getTime() - (combinedStartDateTime.getTimezoneOffset() * 60000)).toISOString();

    // Combine end date and time
    const combinedEndDateTime = new Date(endDate);
    combinedEndDateTime.setHours(endTime.getHours(), endTime.getMinutes());
    const endTimeISO = new Date(combinedEndDateTime.getTime() - (combinedEndDateTime.getTimezoneOffset() * 60000)).toISOString();

    const updates = {
      start_time: startTimeISO,
      end_time: endTimeISO,
      apply_for: applyFor,
    };

    console.log('Updating event with:', updates);

    const { error } = await supabase
      .from('schedule')
      .update(updates)
      .eq('id', eventId);

    if (error) {
      console.error('Error updating event:', error);
      Alert.alert('Error', 'Failed to update event');
    } else {
      Alert.alert('Success', 'Event updated successfully');
      navigation.navigate('Schedule', { refresh: true });  // Use this to navigate back with a refresh parameter
    }
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from('schedule')
      .delete()
      .eq('id', eventId);

    if (error) {
      console.error('Error deleting event:', error);
      Alert.alert('Error', 'Failed to delete event');
    } else {
      Alert.alert('Success', 'Event deleted successfully');
      navigation.navigate('Schedule', { refresh: true });  // Use this to navigate back with a refresh parameter
    }
  };

  const renderPetItem = ({ item }) => (
    <TouchableOpacity onPress={() => { setApplyFor(item.id.toString()); setShowPetPicker(false); }}>
      <View style={styles.petItem}>
        <Image source={{ uri: item.picture_url }} style={styles.petIcon} />
        <Text style={styles.petName}>{item.name}</Text>
      </View>
    </TouchableOpacity>
  );

  const getPetName = (petId) => {
    const pet = pets.find(p => p.id.toString() === petId);
    return pet ? pet.name : 'Select Pet';
  };

  if (!eventDetails) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <Image source={require('../../assets/backbutton.png')} style={styles.headerButtonIcon} />
        </TouchableOpacity>
        <Text style={styles.title}>Event Details</Text>
      </View>
      <View style={styles.container}>
        <Text style={styles.eventTitle}>{eventDetails.title}</Text>
        <Text style={styles.eventDescription}>{eventDetails.description}</Text>

        <Text style={styles.label}>Starts</Text>
        <View style={styles.dateTimeRow}>
          <TouchableOpacity onPress={() => setShowStartDatePicker(true)} style={styles.datePickerButton}>
            <Text style={styles.datePickerButtonText}>{startDate.toDateString()}</Text>
          </TouchableOpacity>
          {showStartDatePicker && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={handleStartDateChange}
            />
          )}
          <TouchableOpacity onPress={() => setShowStartTimePicker(true)} style={styles.timePickerButton}>
            <Text style={styles.datePickerButtonText}>{startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </TouchableOpacity>
          {showStartTimePicker && (
            <DateTimePicker
              value={startTime}
              mode="time"
              display="default"
              onChange={handleStartTimeChange}
            />
          )}
        </View>

        <Text style={styles.label}>Ends</Text>
        <View style={styles.dateTimeRow}>
          <TouchableOpacity onPress={() => setShowEndDatePicker(true)} style={styles.datePickerButton}>
            <Text style={styles.datePickerButtonText}>{endDate.toDateString()}</Text>
          </TouchableOpacity>
          {showEndDatePicker && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              onChange={handleEndDateChange}
            />
          )}
          <TouchableOpacity onPress={() => setShowEndTimePicker(true)} style={styles.timePickerButton}>
            <Text style={styles.datePickerButtonText}>{endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
          </TouchableOpacity>
          {showEndTimePicker && (
            <DateTimePicker
              value={endTime}
              mode="time"
              display="default"
              onChange={handleEndTimeChange}
            />
          )}
        </View>

        <Text style={styles.label}>Apply For</Text>
        <TouchableOpacity onPress={() => setShowPetPicker(true)} style={styles.petPickerButton}>
          <Text style={styles.petPickerButtonText}>{getPetName(applyFor)}</Text>
        </TouchableOpacity>

        <Modal visible={showPetPicker} transparent={true} animationType="slide">
          <View style={styles.petPickerModal}>
            <FlatList
              data={pets}
              renderItem={renderPetItem}
              keyExtractor={(item) => item.id.toString()}
            />
            <TouchableOpacity onPress={() => setShowPetPicker(false)} style={styles.petPickerCloseButton}>
              <Text style={styles.petPickerCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Modal>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.buttonText}>Finish</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Text style={styles.buttonText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  headerButton: {
    padding: 10,
  },
  headerButtonIcon: {
    width: 30,
    height: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F1F1F',
    textAlign: 'center',
    flex: 1,
  },
  container: {
    padding: 20,
  },
  eventTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F1F1F',
    textAlign: 'left',
    marginBottom: 5,
  },
  eventDescription: {
    fontSize: 16,
    color: '#1F1F1F',
    textAlign: 'left',
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    marginBottom: 10,
    color: '#1F1F1F',
  },
  dateTimeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  datePickerButton: {
    flex: 1,
    marginVertical: 10,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    marginRight: 5,
    borderColor: '#1F1F1F',
    borderWidth: 1,
  },
  timePickerButton: {
    flex: 1,
    marginVertical: 10,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    marginLeft: 5,
    borderColor: '#1F1F1F',
    borderWidth: 1,
  },
  datePickerButtonText: {
    color: '#1F1F1F',
    fontSize: 16,
    textAlign: 'center',
  },
  petPickerButton: {
    marginVertical: 10,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    borderColor: '#1F1F1F',
    borderWidth: 1,
  },
  petPickerButtonText: {
    color: '#1F1F1F',
    fontSize: 16,
    textAlign: 'center',
  },
  petPickerModal: {
    flex: 1,
    backgroundColor: '#FFF',
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  petItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#CCC',
  },
  petIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10,
  },
  petName: {
    fontSize: 16,
    color: '#1F1F1F',
  },
  petPickerCloseButton: {
    marginTop: 20,
    padding: 10,
    borderRadius: 5,
    backgroundColor: '#5E5E5E',
  },
  petPickerCloseButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  submitButton: {
    backgroundColor: '#445E6B',
    padding: 10,
    flex: 1,
    alignItems: 'center',
    marginRight: 5,
  },
  deleteButton: {
    backgroundColor: '#BCCDD7',
    padding: 10,
    flex: 1,
    alignItems: 'center',
    marginLeft: 5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
  },
});

export default EventDetailsScreen;
