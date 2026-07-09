import type { YearGroup } from '../../types/profile';

interface YearGroupSelectorProps {
  childName: string;
  selectedYearGroup: YearGroup | null;
  onSelect: (yearGroup: YearGroup) => void;
}

const YEAR_GROUP_OPTIONS: {
  value: YearGroup;
  label: string;
  age: string;
  description: string;
  image: string;
  recommended?: boolean;
}[] = [
  {
    value: 'Year1',
    label: 'Year 1',
    age: 'Age 5–6',
    description: 'Great for children building confidence with spelling and sounds',
    image: '/assets/plants/plant-2.svg',
    recommended: true,
  },
  {
    value: 'Reception',
    label: 'Reception',
    age: 'Age 4–5',
    description: 'Perfect for developing early letter sounds',
    image: '/assets/plants/plant-1.svg',
  },
  {
    value: 'Year2',
    label: 'Year 2',
    age: 'Age 6–7',
    description: 'Ideal for growing readers',
    image: '/assets/plants/plant-3.svg',
  },
];

export function YearGroupSelector({
  selectedYearGroup,
  onSelect,
}: YearGroupSelectorProps) {
  return (
    <div>
      <div className="year-group-heading">
        <h1 className="font-display">
          What <strong>year</strong> is your child in at school?
        </h1>
        <p className="subtext">
          Not sure? Pick the closest age, you can adjust later.
        </p>
      </div>

      <div className="year-cards">
        {YEAR_GROUP_OPTIONS.map((option) => {
          const isSelected = selectedYearGroup === option.value;

          return (
            <button
              key={option.value}
              onClick={() => onSelect(option.value)}
              className={`year-card ${isSelected ? 'selected' : ''}`}
            >
              {option.recommended && (
                <div className="recommended-badge">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <polygon
                      points="6,1 7.5,4.2 11,4.6 8.5,7 9.1,10.5 6,8.8 2.9,10.5 3.5,7 1,4.6 4.5,4.2"
                      fill="white"
                    />
                  </svg>
                  Recommended
                </div>
              )}

              <div className="year-card-illustration">
                <img src={option.image} alt="" aria-hidden="true" className="year-card-image" />
              </div>

              <div className="year-card-content">
                <h3 className="font-display">{option.label}</h3>
                <p className="age">{option.age}</p>
                <p className="description">{option.description}</p>
              </div>

              <div className={`radio-indicator ${isSelected ? 'selected' : ''}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
