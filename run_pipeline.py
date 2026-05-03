from module1_parser import run_module1
from module2_rule_generator import run_module2
from module3_hallucination_checker import check_hallucination
from module4_mitigation import mitigate_rule
from module5_execution import run_execution


while True:
    command = input("\nEnter smart home command or type 'exit': ")

    if command.lower() == "exit":
        print("Stopped.")
        break

    parsed = run_module1(command)
    # print("\nModule 1 - Parsed Command:")
    # print(parsed)

    if parsed.get("type") == "unknown":
        print("\nNot a smart home command. Ignored.")
        continue

    rule = run_module2(parsed)
    # print("\nModule 2 - Generated Rule:")
    # print(rule)

    valid, message = check_hallucination(rule)

    if valid:
        print("\nRule is valid.")
        run_execution(rule)

    else:
        print("\nHallucination detected:")
        print(message)

        print("\nTrying mitigation...")
        fixed_rule, status = mitigate_rule(rule)

        if status == "mitigated_successfully":
            print("\nMitigation successful.")
            # print("\nFixed Rule:")
            # print(fixed_rule)

            run_execution(fixed_rule)

        else:
            print("\nMitigation failed.")
            print("\nInvalid command. Need user clarification.")