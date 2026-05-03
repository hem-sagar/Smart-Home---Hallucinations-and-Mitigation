# Smart Home Command Pipeline

A natural language processing pipeline for smart home command execution. This system parses user commands, generates rules, validates them against a device catalog, detects hallucinations, applies mitigation strategies, and executes valid commands.

## Overview

The Smart Home Command Pipeline is a 5-module system that processes natural language smart home commands through the following stages:

1. **Parsing** - Converts natural language commands to structured JSON
2. **Rule Generation** - Creates executable rules from parsed commands
3. **Hallucination Detection** - Validates rules against device catalog and constraints
4. **Mitigation** - Attempts to fix invalid or problematic rules
5. **Execution** - Executes valid rules and logs the results

## Project Structure

```
Smart Home/
├── module1_parser.py           # Command parsing with LLM support
├── module2_rule_generator.py   # Rule generation from parsed commands
├── module3_hallucination_checker.py  # Validation and constraint checking
├── module4_mitigation.py       # Error correction and rule fixing
├── module5_execution.py        # Rule execution and logging
├── run_pipeline.py             # Main interactive pipeline
├── data/
│   ├── devices.csv            # Device catalog with room and actions
│   ├── rooms.csv              # Available rooms in the smart home
│   └── sensors.csv            # Sensor data
├── logs/
│   ├── command_logs.csv        # Parsed command history
│   ├── execution_logs.csv      # Execution results
│   ├── mitigation_logs.csv     # Mitigation attempts
│   └── rule_logs.csv           # Generated rules
├── test/                       # Unit tests for each module
└── .env                        # Environment variables (API keys)
```

## Modules

### Module 1: Parser (`module1_parser.py`)
Parses natural language commands into structured JSON format.

**Key Features:**
- Converts user commands to JSON structure
- Uses OpenAI API for NLP processing
- Handles multiple actions in a single command
- Identifies room, device, and action from commands
- Distinguishes between smart-home and non-smart-home commands
- Logs all parsed commands

### Module 2: Rule Generator (`module2_rule_generator.py`)
Generates executable rules from parsed commands.

**Key Features:**
- Creates rule objects with IDs and timestamps
- Supports immediate triggers and conditional execution
- Includes action and condition formatting
- Uses LLM for rule generation when needed
- Provides default rule formatting

### Module 3: Hallucination Checker (`module3_hallucination_checker.py`)
Validates rules against device catalog and constraints.

**Key Features:**
- Loads device, room, and sensor catalogs from CSV
- Validates room existence
- Checks device availability in specified rooms
- Verifies action validity for devices
- Detects logical inconsistencies
- Returns validation status with detailed messages

### Module 4: Mitigation (`module4_mitigation.py`)
Attempts to fix invalid or problematic rules.

**Key Features:**
- Identifies devices across multiple rooms
- Applies user presence constraints
- Fixes device room assignments
- Corrects invalid actions
- Classifies mitigation strategies (fix, clarify, ignore)
- Logs all mitigation attempts

### Module 5: Execution (`module5_execution.py`)
Executes valid rules and maintains execution logs.

**Key Features:**
- Executes individual actions
- Logs execution results
- Records rule execution metadata
- Stores results in execution logs
- Handles action values and device parameters

## Requirements

- Python 3.8+
- OpenAI API key (for LLM-based parsing and rule generation)
- Required Python packages:
  - `openai`
  - `python-dotenv`

## Installation

1. Clone or download the project:
```bash
cd "Smart Home"
```

2. Install dependencies:
```bash
pip install openai python-dotenv
```

3. Set up environment variables:
Create a `.env` file in the project root with:
```
OPENAI_API_KEY=your_api_key_here
```

4. Prepare data files:
Ensure the following CSV files exist in the `data/` directory:
- `devices.csv` - Device catalog
- `rooms.csv` - Room list
- `sensors.csv` - Sensor data

## Usage

### Run the Interactive Pipeline

```bash
python run_pipeline.py
```

This starts an interactive prompt where you can enter smart home commands:

```
Enter smart home command or type 'exit': Turn on the living room lights
Rule is valid.
Executed: turn_on light in living_room

Enter smart home command or type 'exit': Set temperature to 72 in bedroom
Hallucination detected: ...
Trying mitigation...
Mitigation successful.
Executed: set_temperature thermostat in bedroom_1 with value 72
```

### Run Tests

```bash
# Run all tests
python -m pytest test/

# Run specific module test
python -m pytest test/test_module1.py
```

## Data Files Format

### devices.csv
| room | device | allowed_actions |
|------|--------|-----------------|
| living_room | light | turn_on;turn_off |
| living_room | tv | turn_on;turn_off;set_channel |
| bedroom_1 | light | turn_on;turn_off |
| bedroom_1 | thermostat | set_temperature;read |

### rooms.csv
| room |
|------|
| living_room |
| bedroom_1 |
| bedroom_2 |
| kitchen |
| washroom |
| garage |

### sensors.csv
| sensor_id | location | type |
|-----------|----------|------|
| sensor_1 | living_room | motion |
| sensor_2 | kitchen | temperature |

## Logs

The system maintains detailed logs in the `logs/` directory:

- **command_logs.csv** - All parsed commands with timestamps
- **rule_logs.csv** - Generated rules and their creation times
- **mitigation_logs.csv** - Mitigation attempts and outcomes
- **execution_logs.csv** - Executed rules and their results

Each log includes metadata for debugging and analysis.

## Example Commands

```
# Basic commands
"Turn on the living room lights"
"Close the kitchen door"

# Commands with values
"Set temperature to 72"
"Set volume to 30"

# Commands with conditions
"Turn on lights when motion detected"

# Multiple actions
"Turn off all lights and lock the doors"
```

## Workflow

```
User Command
    ↓
[Module 1] Parser → Parsed JSON
    ↓
[Module 2] Rule Generator → Rule Object
    ↓
[Module 3] Hallucination Checker → Valid/Invalid
    ├→ Valid → [Module 5] Execution
    └→ Invalid → [Module 4] Mitigation
                   ↓
            Fixed/Clarify/Ignore
                   ↓
         [Module 5] Execution/Logging
```

## Features

✅ Natural language command parsing
✅ Intelligent rule generation
✅ AI-powered hallucination detection
✅ Automatic error mitigation
✅ Comprehensive logging
✅ Device catalog validation
✅ Multi-room support
✅ Conditional execution support
✅ User presence awareness

## Error Handling

The system handles various error scenarios:

- **Unknown Commands** - Non-smart-home commands are ignored
- **Invalid Devices** - Attempts mitigation by finding devices in other rooms
- **Invalid Actions** - Corrects actions based on device capabilities
- **Ambiguous Rooms** - Uses "unknown" when room is not specified
- **Hallucinations** - Detects and attempts to fix AI-generated errors

## Mitigation Strategies

1. **Fix** - Automatically corrects the rule (e.g., finds correct room for device)
2. **Clarify** - Rule requires user clarification
3. **Ignore** - Rule cannot be fixed and is ignored

## Contributing

When adding new modules or features:

1. Follow the 5-module pipeline structure
2. Add unit tests in the `test/` directory
3. Update data files if new devices or rooms are added
4. Maintain logging for debugging and analysis
5. Update this README with new features

## License

[Specify your license here]

## Support

For issues or questions, please check the logs directory for execution and error details.
