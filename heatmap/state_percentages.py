import pandas as pd

data = pd.read_csv("mental-health-treatment.csv")
data = data.dropna(subset=["Value"])

df = pd.DataFrame(columns = ['State', 'Value'])

states = [
    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut", "Delaware",
    "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky",
    "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
    "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey", "New Mexico",
    "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma", "Oregon", "Pennsylvania",
    "Rhode Island", "South Carolina", "South Dakota", "Tennessee", "Texas", "Utah", "Vermont",
    "Virginia", "Washington", "West Virginia", "Wisconsin", "Wyoming"
]

for state in states:
    avg_value = sum(data[data["State"] == state]["Value"])/len(data[data["State"] == state]["Value"])
    df.loc[-1] = [state, avg_value]
    df.index = df.index + 1
    df = df.sort_index()
    
df.to_csv('treatment-by-state.csv', index = False)