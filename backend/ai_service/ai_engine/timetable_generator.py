def generate_timetable(subjects, total_hours):

    timetable = {}
    priorities = []
    
    # Calculate priority based on accuracy
    for s in subjects:

        correct = s.get("correct_questions", 0)
        total = s.get("total_questions", 1)

        accuracy = (correct / total) * 100

        priority = 100 - accuracy

        priorities.append(priority)
        s["priority"] = priority

    total_priority = sum(priorities)

    # safety check
    if total_priority == 0:
        total_priority = len(subjects)

    # allocate study hours
    for s in subjects:

        allocated = (s["priority"] / total_priority) * total_hours

        timetable[s["name"]] = round(allocated, 2)

    return timetable